from celery import shared_task
from .utils import query_groq_ai
import json
from celery import shared_task
from .utils import process_chunks_async
import asyncio
import json

@shared_task
def process_large_file_in_background(file_content_json, user_input):
    """
    Processes a large file asynchronously and queries the Groq API for each chunk.
    """
    file_content = json.loads(file_content_json)  # Deserialize the content
    combined_response = ""

    if isinstance(file_content, list):  # Process multiple chunks
        try:
            print(f"Processing {len(file_content)} chunks asynchronously.")
            combined_response = asyncio.run(process_chunks_async(user_input, file_content))
        except Exception as e:
            print(f"Error during async processing of chunks: {str(e)}")
            combined_response = f"Error during async processing: {str(e)}"
    else:  # Process a single chunk
        try:
            print("Processing single chunk asynchronously.")
            response = asyncio.run(process_chunks_async(user_input, [file_content]))
            combined_response = response.strip()
        except Exception as e:
            print(f"Error processing single chunk asynchronously: {str(e)}")
            combined_response = f"Error: {str(e)}"

    print(f"Final Combined Response: {combined_response}")
    return combined_response.strip()
