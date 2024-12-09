from celery import shared_task
from .utils import *
import time

from celery.exceptions import SoftTimeLimitExceeded
import json

@shared_task
def process_large_file_in_background(file_content_json, user_input):
    """
    Asynchronously processes a large file and queries Groq AI in the background.
    """
    # Deserialize the file content
    file_content = json.loads(file_content_json)  # Deserialize the content

    combined_response = ""
    if isinstance(file_content, list):  # Process each chunk if content is chunked
        for chunk in file_content:
            response = query_groq_ai(user_input, chunk)
            if isinstance(response, dict):
                combined_response += response.get('response', '') + "\n"
            else:
                combined_response += str(response) + "\n"
    else:  # Single chunk of file content
        response = query_groq_ai(user_input, file_content)
        if isinstance(response, dict):
            combined_response = response.get('response', '')
        else:
            combined_response = str(response)
    
    return combined_response
