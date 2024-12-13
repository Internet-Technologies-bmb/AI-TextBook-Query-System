import asyncio
from celery import shared_task
from .utils import query_groq_ai, process_chunks_async
import json

@shared_task
def process_large_file_in_background(file_content_json, user_input):
    """
    Processes a large file asynchronously and queries the Groq API for each chunk.
    """
    try:
        # Deserialize the file content
        file_content = json.loads(file_content_json)
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {str(e)}")
        return f"Error decoding JSON: {str(e)}"

    combined_response = ""

    # Check if file content is a list of chunks or a single chunk
    if isinstance(file_content, list):  # Process multiple chunks
        try:
            print(f"Processing {len(file_content)} chunks asynchronously.")
            # Use asyncio's event loop to execute the async function
            combined_response = asyncio.run(process_chunks_async(user_input, file_content))
        except Exception as e:
            print(f"Error during async processing of chunks: {str(e)}")
            combined_response = f"Error during async processing: {str(e)}"
    else:  # Process a single chunk
        try:
            print("Processing single chunk asynchronously.")
            # Since it's a single chunk, pass it as a list to match the expected input
            response = asyncio.run(process_chunks_async(user_input, [file_content]))
            combined_response = response.strip()
        except Exception as e:
            print(f"Error processing single chunk asynchronously: {str(e)}")
            combined_response = f"Error: {str(e)}"

    print(f"Final Combined Response: {combined_response}")
    return combined_response.strip()
