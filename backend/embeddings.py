import os
import json
import numpy as np
from datetime import datetime

# In a real application, you would use a proper vector database and embedding API
# This is a simplified mock implementation

# Mock vector database
vector_db = {}

def extract_text_from_file(file_path):
    """
    Extract text content from various file types.
    In a real implementation, you would use libraries like PyPDF2, python-docx, etc.
    """
    # This is a simplified mock implementation
    file_extension = file_path.split('.')[-1].lower()
    
    # In a real app, you would use appropriate libraries for each file type
    if file_extension in ['txt', 'json']:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        # Mock text extraction for other file types
        return f"Extracted text content from {file_path}"

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

def create_mock_embedding(text):
    """
    Create a mock embedding vector for the text.
    In a real app, you would call an embedding API like OpenAI's.
    """
    # This creates a deterministic but unique vector based on the text content
    # In a real app, this would be a call to an embedding model
    import hashlib
    hash_object = hashlib.md5(text.encode())
    hash_hex = hash_object.hexdigest()
    
    # Convert the hex hash to a list of floats to simulate an embedding vector
    vector = []
    for i in range(0, len(hash_hex), 2):
        if i+1 < len(hash_hex):
            value = int(hash_hex[i:i+2], 16) / 255.0  # Normalize to 0-1
            vector.append(value)
    
    # Pad to ensure consistent dimensionality
    while len(vector) < 64:  # Using 64 dimensions for our mock embeddings
        vector.append(0.0)
    
    return vector[:64]  # Ensure exactly 64 dimensions

def create_embeddings(file_path, metadata):
    """
    Process a file and create embeddings for its content.
    """
    try:
        # Extract text from the file
        text = extract_text_from_file(file_path)
        
        # Split text into chunks
        chunks = chunk_text(text)
        
        # Create embeddings for each chunk
        for i, chunk in enumerate(chunks):
            chunk_id = f"{metadata['id']}_chunk_{i}"
            embedding = create_mock_embedding(chunk)
            
            # Store in our mock vector database
            vector_db[chunk_id] = {
                'embedding': embedding,
                'text': chunk,
                'metadata': {
                    **metadata,
                    'chunkIndex': i,
                    'chunkCount': len(chunks)
                }
            }
        
        print(f"Created {len(chunks)} embeddings for {file_path}")
        return True
    except Exception as e:
        print(f"Error creating embeddings: {str(e)}")
        raise

def cosine_similarity(vec1, vec2):
    """
    Calculate cosine similarity between two vectors.
    """
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm_a = sum(a * a for a in vec1) ** 0.5
    norm_b = sum(b * b for b in vec2) ** 0.5
    
    if norm_a == 0 or norm_b == 0:
        return 0
    
    return dot_product / (norm_a * norm_b)

def semantic_search(query, course_id, top_k=5):
    """
    Perform semantic search using the query.
    """
    # Create embedding for the query
    query_embedding = create_mock_embedding(query)
    
    # Calculate similarity with all stored embeddings
    results = []
    for chunk_id, data in vector_db.items():
        # Filter by course ID if specified
        if course_id != 'default' and data['metadata']['courseId'] != course_id:
            continue
        
        similarity = cosine_similarity(query_embedding, data['embedding'])
        results.append({
            'id': chunk_id,
            'text': data['text'],
            'metadata': data['metadata'],
            'score': similarity
        })
    
    # Sort by similarity score (descending)
    results.sort(key=lambda x: x['score'], reverse=True)
    
    # Return top k results
    return results[:top_k]
