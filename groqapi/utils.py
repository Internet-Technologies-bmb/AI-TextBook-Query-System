import requests
import aiohttp
import asyncio
from django.conf import settings

def query_groq_ai(user_message, file_content=None):
    """
    Sends a request to the Groq AI API with the user message and optional file content.
    """
    url = 'https://api.groq.com/openai/v1/chat/completions'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {settings.GROQ_API_KEY}',
    }
    payload = {
        "model": "llama3-8b-8192",
        "messages": [
            {"role": "user", "content": user_message}
        ]
    }
    
    if file_content:
        payload["messages"].append({
            "role": "system",
            "content": f"Here is the content of the uploaded file:\n{file_content}"
        })

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

async def query_groq_ai_async(user_message, file_content=None):
    """
    Asynchronously sends a request to the Groq AI API with the user message and optional file content.
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
            async with session.post(url, headers=headers, json=payload, timeout=30) as response:
                response.raise_for_status()
                return await response.json()
    except aiohttp.ClientError as e:
        return {"error": str(e)}

async def process_chunks_async(user_message, chunks):
    """
    Processes multiple chunks of file content concurrently using asynchronous requests.
    """
    tasks = [query_groq_ai_async(user_message, chunk) for chunk in chunks]
    responses = await asyncio.gather(*tasks)
    return "\n".join([response.get('response', '') for response in responses if 'response' in response])

def process_large_file_async(file_content, user_input):
    """
    Initiates the asynchronous processing of large file content and user input.
    """
    if isinstance(file_content, list):
        return asyncio.run(process_chunks_async(user_input, file_content))
    else:
        return query_groq_ai_async(user_input, file_content)

import PyPDF2

def extract_text_from_pdf(uploaded_file, chunk_size=2000):
    """
    Extracts text from a PDF file and splits it into smaller chunks.
    """
    try:
        reader = PyPDF2.PdfReader(uploaded_file)
        text = ""
        
        for page_num in range(len(reader.pages)):
            page = reader.pages[page_num]
            text += page.extract_text() + "\n"  # Add extracted text from each page

        if not text:
            return ["No text found in the PDF."], 0

        # Split the text into smaller chunks to avoid payload limits
        chunks = [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]
        word_count = len(text.split())  # Count words in the extracted text
        return chunks, word_count

    except Exception as e:
        return [f"Error extracting text from PDF: {str(e)}"], 0



