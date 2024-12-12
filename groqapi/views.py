from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .forms import FileUploadForm
from .tasks import process_large_file_in_background
from .models import UploadedFile
from django.core.exceptions import ValidationError
import json
import time
from celery.result import AsyncResult
import requests
from .utils import *

@csrf_exempt
def upload_and_chat(request):
    """
    Handles file uploads, triggers Celery tasks, and monitors task progress.
    """
    if request.method == 'POST':
        print("Received a POST request.")
        form = FileUploadForm(request.POST, request.FILES)

        if form.is_valid():
            uploaded_file = request.FILES.get('file')
            user_input = form.cleaned_data.get('user_input')

            if not uploaded_file:
                return JsonResponse({'error': 'No file uploaded'}, status=400)

            try:
                # Extract file content
                if uploaded_file.name.endswith('.pdf'):
                    file_content, word_count = extract_text_from_pdf(uploaded_file)
                else:
                    file_content = uploaded_file.read().decode('utf-8')
                    word_count = len(file_content.split())

                file_content_json = json.dumps(file_content)

                # Trigger the Celery task
                result = process_large_file_in_background.apply_async(args=[file_content_json, user_input])
                print(f"Task ID: {result.id}")

                # Poll for the task's completion
                for _ in range(30):  # Polling with a max of 30 attempts
                    task_result = AsyncResult(result.id)
                    if task_result.state == 'SUCCESS':
                        # Task completed successfully
                        return JsonResponse({
                            'status': 'Success',
                            'result': task_result.result,  # Actual processed result
                            'word_count': word_count,
                        })
                    elif task_result.state == 'FAILURE':
                        # Task failed
                        return JsonResponse({
                            'status': 'Failure',
                            'error': str(task_result.result),
                        }, status=500)
                    time.sleep(5)  # Wait 5 seconds before polling again

                # If the task is still pending after polling
                return JsonResponse({
                    'status': 'Pending',
                    'message': 'Task is still processing. Please check later.',
                }, status=202)

            except Exception as e:
                print(f"Error during task execution: {str(e)}")
                return JsonResponse({'error': str(e)}, status=500)

        # Invalid form submission
        return JsonResponse({'error': 'Invalid form submission'}, status=400)

    # Invalid request method
    print("Invalid request method or submission.")
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
