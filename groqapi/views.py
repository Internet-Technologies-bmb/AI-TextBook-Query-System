from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .forms import FileUploadForm
from .tasks import process_large_file_in_background
from .models import UploadedFile
from django.core.exceptions import ValidationError
import json
import time
from celery.result import AsyncResult
from django.utils.timezone import now
from api.models import Chat, Message  # Import Chat and Message from the correct module
from rest_framework.authentication import get_authorization_header
from api.utils import CustomJWTAuthentication  # Import the custom JWT authentication class
from .utils import extract_text_from_pdf



@csrf_exempt
def upload_and_chat(request):
    # Perform JWT authentication manually
    authentication = CustomJWTAuthentication()
    user, _ = authentication.authenticate(request)  # Authenticate using the custom method

    if user is None:
        return JsonResponse({'error': 'Authentication failed'}, status=401)

    if request.method == 'POST':
        form = FileUploadForm(request.POST, request.FILES)

        if form.is_valid():
            uploaded_file = request.FILES.get('file')
            user_input = form.cleaned_data.get('user_input')
            chat_id = form.cleaned_data.get('chat_id')  # Get chat_id from the request

            if not chat_id:
                return JsonResponse({'error': 'chat_id is required'}, status=400)

            try:
                # Ensure the chat exists
                chat = Chat.objects.get(id=chat_id)

                # Handle assigning the user (using the authenticated user)
                user_profile = user  # The `user` is already an instance of `UserProfile`

                # Save user message
                user_message = Message.objects.create(
                    chat=chat,
                    user=user_profile,  # Assign UserProfile instance instead of User
                    role='user',
                    content=user_input,
                    file=uploaded_file,
                )

                # Trigger the AI process
                if uploaded_file:
                    if uploaded_file.name.endswith('.pdf'):
                        file_content, _ = extract_text_from_pdf(uploaded_file)
                    else:
                        try:
                            file_content = uploaded_file.read().decode('utf-8')
                            print(f"File content before JSON parsing: {file_content[:500]}")  # Debugging output

                            # Try to parse as JSON if appropriate
                            try:
                                file_content = json.loads(file_content)
                            except json.JSONDecodeError as e:
                                print(f"Error decoding JSON: {e}")  # Log decoding errors
                                return JsonResponse({'error': f'Error decoding JSON: {str(e)}'}, status=400)

                            # Check if file_content is a list
                            if isinstance(file_content, list):
                                # Convert list to a string (e.g., join all elements if it makes sense for your use case)
                                file_content = '\n'.join(file_content)

                            # Ensure file_content is a string before passing to Celery task
                            if not isinstance(file_content, str):
                                return JsonResponse({'error': 'File content is not in the expected format'}, status=400)

                        except Exception as e:
                            return JsonResponse({'error': f'Error reading file: {str(e)}'}, status=400)

                    # Trigger Celery task to process the file content
                    result = process_large_file_in_background.apply_async(args=[json.dumps(file_content), user_input])  # Pass valid JSON

                for _ in range(30):
                    task_result = AsyncResult(result.id)
                    if task_result.state == 'SUCCESS':
                        ai_response = task_result.result
                        ai_message = Message.objects.create(
                            chat=chat,
                            user=None,  # AI messages don't have an associated user
                            role='assistant',
                            content=ai_response,
                        )
                        return JsonResponse({
                            'user_message': {
                                'id': user_message.id,
                                'content': user_message.content,
                            },
                            'ai_message': {
                                'id': ai_message.id,
                                'content': ai_message.content,
                            },
                        })
                    elif task_result.state == 'FAILURE':
                        return JsonResponse({'error': 'AI processing failed'}, status=500)
                    time.sleep(5)

                return JsonResponse({'status': 'Processing...'}, status=202)
            except Chat.DoesNotExist:
                return JsonResponse({'error': 'Chat not found'}, status=404)
        else:
            return JsonResponse({'error': 'Invalid form submission'}, status=400)
    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def get_task_status(request, task_id):
    """
    Check the status and result of a Celery task by its task ID.
    """
    result = AsyncResult(task_id)
    if result.state == 'PENDING':
        return JsonResponse({'status': 'Pending'}, status=202)
    elif result.state == 'SUCCESS':
        return JsonResponse({'status': 'Success', 'result': result.result})
    elif result.state == 'FAILURE':
        return JsonResponse({'status': 'Failure', 'error': str(result.result)}, status=500)
    else:
        return JsonResponse({'status': result.state}, status=202)
