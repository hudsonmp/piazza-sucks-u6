import os
import json
import numpy as np
from datetime import datetime
import requests
from openai import OpenAI

# Load environment variables from .env file
try:
    from load_env import load_env
    load_env()
except ImportError:
    print("Warning: load_env module not found. Using existing environment variables.")

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Supabase connection
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_PUBLIC")

# Supabase API headers
def get_admin_headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }

def get_anon_headers():
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }

def extract_text_from_file(file_path, file_type='text/plain'):
    """
    Extract text content from various file types.
    This is a simplified implementation. In production, use specific libraries for each file type.
    """
    if file_type == 'text/plain':
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    # In a real application, you would add support for more file types:
    # - PDF: using PyPDF2 or pdfminer
    # - DOCX: using python-docx
    # - PPTX: using python-pptx
    # etc.
    else:
        # For simplicity, just read the file as text
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except:
            return "Could not extract text from this file type."

def chunk_text(text, chunk_size=1000, overlap=200):
    """
    Split text into overlapping chunks for better semantic search.
    """
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        # Try to find a natural break point like a newline or period
        if end < len(text):
            # Look for the last period or newline within the chunk
            for break_char in ['\n', '.', '!', '?']:
                last_break = text[start:end].rfind(break_char)
                if last_break != -1:
                    end = start + last_break + 1
                    break
        
        chunks.append(text[start:end])
        start = end - overlap if end - overlap > start else end
    
    return chunks

def create_embedding(text):
    """
    Create embedding using OpenAI API.
    """
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

def process_documents(file_content, metadata):
    """
    Process content into documents with chunks.
    """
    # Split the content into chunks
    chunks = chunk_text(file_content)
    
    documents = []
    for i, chunk in enumerate(chunks):
        documents.append({
            "id": f"{metadata['fileId']}-chunk-{i}",
            "content": chunk,
            "metadata": {
                **metadata,
                "chunkIndex": i,
                "totalChunks": len(chunks)
            }
        })
    
    return documents

def create_embeddings_for_documents(documents):
    """
    Create and store embeddings for documents in Supabase.
    """
    try:
        # Use Supabase directly via API
        for doc in documents:
            # Generate embedding
            embedding = create_embedding(doc['content'])
            
            # Store in database via API
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/embeddings",
                headers=get_admin_headers(),
                json={
                    "id": doc['id'],
                    "content": doc['content'],
                    "embedding": embedding,
                    "metadata": doc['metadata'],
                    "created_at": datetime.now().isoformat()
                }
            )
            
            if response.status_code not in [200, 201]:
                raise Exception(f"Failed to store embedding: {response.text}")
        
        return {"success": True, "count": len(documents)}
    except Exception as e:
        print("Error creating embeddings:", str(e))
        raise e

def semantic_search(query, course_id, limit=5):
    """
    Perform semantic search using Supabase and matching function.
    """
    # Create embedding for the query
    query_embedding = create_embedding(query)
    
    # Use Supabase RPC to call the match_documents function
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/match_documents",
        headers=get_admin_headers(),
        json={
            "query_embedding": query_embedding,
            "match_threshold": 0.5,
            "match_count": limit,
            "course_id": course_id
        }
    )
    
    if response.status_code != 200:
        raise Exception(f"Error in semantic search: {response.text}")
    
    return response.json()

def setup_vector_store():
    """
    Set up the vector store in Supabase.
    """
    try:
        # Enable pgvector extension
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/enable_pgvector_extension",
            headers=get_admin_headers()
        )
        
        if response.status_code not in [200, 204]:
            print(f"Error enabling pgvector extension: {response.text}")
        
        # Create the embeddings table
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/create_embeddings_table",
            headers=get_admin_headers()
        )
        
        if response.status_code not in [200, 204]:
            print(f"Error creating embeddings table: {response.text}")
        
        # Create the match documents function
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/create_match_documents_function",
            headers=get_admin_headers()
        )
        
        if response.status_code not in [200, 204]:
            print(f"Error creating match_documents function: {response.text}")
        
        return {
            "success": True,
            "message": "Vector store setup complete"
        }
    except Exception as e:
        print(f"Error setting up vector store: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }
