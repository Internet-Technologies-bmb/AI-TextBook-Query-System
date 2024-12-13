import requests
import aiohttp
import asyncio
from django.conf import settings
import json
from tenacity import retry, stop_after_attempt, wait_exponential

def query_groq_ai(user_message, file_content=None):
    """
    Sends a request to the Groq AI API with proper logging.
    """
    url = 'https://api.groq.com/openai/v1/chat/completions'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {settings.GROQ_API_KEY}',
    }
    payload = {
        "model": "llama3-8b-8192",
        "messages": [{"role": "user", "content": user_message}]
    }

    if file_content:
        payload["messages"].append({
            "role": "system",
            "content": f"Here is the content of the uploaded file:\n{file_content}"
        })

    try:
        print(f"Payload to Groq API: {json.dumps(payload, indent=2)}")
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        print(f"Groq API Response: {response.text}")
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Request error: {str(e)}")
        return {"error": str(e)}


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def query_groq_ai_async(user_message, file_content=None):
    """
    Asynchronously sends a request to the Groq AI API with retry logic.
    """
    url = 'https://api.groq.com/openai/v1/chat/completions'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {settings.GROQ_API_KEY}',
    }
    payload = {
        "model": "llama3-8b-8192",
        "messages": [{"role": "user", "content": user_message}]
    }

    if file_content:
        payload["messages"].append({
            "role": "system",
            "content": f"Here is the content of the uploaded file:\n{file_content}"
        })

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload, timeout=60) as response:
                response.raise_for_status()
                response_text = await response.text()
                print(f"Groq API Async Response: {response_text}")
                return json.loads(response_text)
                # return await response.json()
    except aiohttp.ClientError as e:
        print(f"Groq API async request error: {e}")
        return {"error": str(e)}

async def process_chunks_async(user_message, chunks):
    """
    Processes multiple chunks concurrently with robust error handling.
    """
    tasks = [query_groq_ai_async(user_message, chunk) for chunk in chunks]
    combined_responses = []

    # Process each chunk
    for idx, response in enumerate(await asyncio.gather(*tasks, return_exceptions=True)):
        if isinstance(response, Exception):
            # Log and append error details for failed chunks
            print(f"Error processing chunk {idx}: {response}")
            combined_responses.append(f"Error in chunk {idx}: {response}")
        elif isinstance(response, dict) and "choices" in response:
            try:
                # Extract the 'content' field
                content = response["choices"][0]["message"]["content"]
                print(f"Response for chunk {idx}: {content}")
                combined_responses.append(content)  # Append extracted content
            except (IndexError, KeyError) as e:
                # Handle malformed responses
                print(f"Error extracting content from chunk {idx}: {response} - {e}")
                combined_responses.append(f"Error in chunk {idx}: Malformed response")
        else:
            # Handle unexpected response formats
            print(f"Unexpected response format for chunk {idx}: {response}")
            combined_responses.append(f"Unexpected response in chunk {idx}: {response}")

    # Combine all responses into a single string
    final_response = "\n".join(combined_responses)
    print(f"Final Combined Response: {final_response}")
    return final_response



def process_large_file_async(file_content, user_input):
    """
    Initiates the asynchronous processing of large file content and user input.
    """
    if isinstance(file_content, list):
        return asyncio.run(process_chunks_async(user_input, file_content))
    else:
        return query_groq_ai_async(user_input, file_content)

import PyPDF2

def extract_text_from_pdf(uploaded_file, chunk_size=1500):
    """
    Extract text from a PDF and split it into chunks, ensuring valid content.
    """
    try:
        reader = PyPDF2.PdfReader(uploaded_file)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if not page_text.strip():
                print("Empty page detected.")
            text += page_text + "\n"

        if not text.strip():
            return ["No text found in the PDF."], 0

        chunks = [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]
        word_count = len(text.split())
        print(f"Generated {len(chunks)} chunks for processing.")
        return chunks, word_count
    except Exception as e:
        print(f"Error extracting text from PDF: {str(e)}")
        return [f"Error extracting text: {str(e)}"], 0
