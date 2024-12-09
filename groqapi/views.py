from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .forms import FileUploadForm
from .tasks import process_large_file_in_background
from .models import UploadedFile
from .utils import extract_text_from_pdf
from django.core.exceptions import ValidationError
import time, json

@csrf_exempt
def upload_and_chat(request):
    if request.method == 'POST':
        form = FileUploadForm(request.POST, request.FILES)
        
        if form.is_valid():
            uploaded_file = request.FILES.get('file')
            user_input = form.cleaned_data.get('user_input')

            if not uploaded_file:
                return JsonResponse({'error': 'No file uploaded'}, status=400)

            file_content = None
            word_count = 0  # Initialize word count

            # Save the file instance to the model
            try:
                file_instance = UploadedFile.objects.create(
                    file=uploaded_file,
                    file_size=uploaded_file.size,
                    file_type=uploaded_file.name.split('.')[-1]
                )
            except Exception as e:
                return JsonResponse({'error': f"Error saving file: {str(e)}"}, status=500)

            # Extract content based on file type
            # Extract content based on file type
            try:
                if uploaded_file.name.endswith('.pdf'):
                    file_content, word_count = extract_text_from_pdf(uploaded_file)
                    print(f"Extracted PDF content (word count: {word_count}): {file_content[:500]}")  # Print first 500 chars
                elif uploaded_file.name.endswith('.txt'):
                    file_content = uploaded_file.read().decode('utf-8')
                    word_count = len(file_content.split())
                    print(f"Extracted TXT content (word count: {word_count}): {file_content[:500]}")  # Print first 500 chars
                else:
                    raise ValidationError(f"Unsupported file type: {uploaded_file.name}")
            except ValidationError as ve:
                return JsonResponse({'error': str(ve)}, status=400)
            except Exception as e:
                return JsonResponse({'error': f"Error reading file: {str(e)}"}, status=500)


            # Trigger Celery task to process the file
            try:
                # Instead of passing the whole file content, serialize it
                file_content_json = json.dumps(file_content)  # Serialize to JSON string

                # Trigger Celery task to process the file
                result = process_large_file_in_background.apply_async(args=[file_content_json, user_input])

                # Wait for the result (you may adjust timeout as needed)
                combined_response = result.get(timeout=180)  # Adjust timeout if needed
                
                #result = process_large_file_in_background.apply_async(args=[file_content, user_input])
                
                # Wait for the result (with a timeout, better to handle exception if the task takes too long)
                #combined_response = result.get(timeout=180)  # Timeout 180 seconds (adjust as needed)

                # Log the task status (useful for debugging)
                print(f"Task Status: {result.status}")
                print(f"Task Result: {combined_response}")

                return JsonResponse({'response': combined_response, 'word_count': word_count})
            
            except Exception as e:
                # Handle the timeout or any other Celery-related errors
                return JsonResponse({'error': f"Error processing file in background: {str(e)}"}, status=500)

    return JsonResponse({'error': 'Invalid form submission'}, status=400)
