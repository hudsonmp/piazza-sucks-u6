from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import numpy as np
from openai import OpenAI
import time
from werkzeug.utils import secure_filename
import psycopg2
from psycopg2.extras import RealDictCursor
import uuid
import requests
import httpx

# Load environment variables from .env file
try:
    from load_env import load_env
    load_env()
except ImportError:
    print("Warning: load_env module not found. Using existing environment variables.")

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}})

# Initialize OpenAI client without proxies parameter
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
    http_client=httpx.Client()
)

# Supabase connection
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE")  # Service role for admin ops
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_PUBLIC")  # Anon key for client-side ops

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

# Database connection
def get_db_connection():
    conn = psycopg2.connect(
        host=os.environ.get("SUPABASE_HOST"),
        database=os.environ.get("SUPABASE_DATABASE"),
        user=os.environ.get("SUPABASE_USER"),
        password=os.environ.get("SUPABASE_PASSWORD")
    )
    conn.autocommit = True
    return conn

# Create embeddings for text
def create_embedding(text):
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

# Function to process and chunk text documents
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

# Extract text content from various file types
def extract_text_from_file(file_path, file_type):
    """
    Extract text from different file types.
    This is a simplified implementation. In production, use specific libraries for each file type.
    """
    if file_type == 'text/plain':
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    # In a real application, you would add support for more file types:
    # - PDF: using PyPDF2 or pdfminer
    # - DOCX: using python-docx
    # - PPTX: using python-pptx
    # - etc.
    else:
        # For simplicity, just read the file as text
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except:
            return "Could not extract text from this file type."

# Semantic search function
def semantic_search(query, course_id, limit=5):
    # Create embedding for the query
    query_embedding = create_embedding(query)
    
    # Connect to the database
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Call the match_documents function
    cursor.execute(
        """
        SELECT * FROM match_documents(%s, 0.5, %s, %s)
        """,
        (query_embedding, limit, course_id)
    )
    
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return results

# Helper function to get current user from token
def get_current_user(auth_header):
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    response = requests.get(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {token}"
        }
    )
    
    if response.status_code != 200:
        return None
    
    return response.json()

# Process documents into chunks and create embeddings
def process_documents(file_content, metadata):
    # Split the content into chunks
    chunks = chunk_text(file_content)
    
    documents = []
    for i, chunk in enumerate(chunks):
        documents.append({
            "id": f"{metadata['fileId']}-chunk-{i}",
            "content": chunk,
            "metadata": {
                **metadata,
                "chunkIndex": i
            }
        })
    
    return documents

# Create embeddings for document chunks
def create_embeddings_for_documents(documents):
    try:
        # Connect to the database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        for doc in documents:
            # Generate embedding
            embedding = create_embedding(doc['content'])
            
            # Store in database
            cursor.execute(
                """
                INSERT INTO embeddings (id, content, embedding, metadata, created_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    doc['id'],
                    doc['content'],
                    embedding,
                    json.dumps(doc['metadata']),
                    time.strftime('%Y-%m-%d %H:%M:%S')
                )
            )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"success": True, "count": len(documents)}
    except Exception as e:
        print("Error creating embeddings:", str(e))
        raise e

# New endpoint for embedding course materials
@app.route('/api/materials/process', methods=['POST'])
def process_material():
    # Get the uploaded file and metadata
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # Get other form data
    material_type = request.form.get('material_type', '')  # syllabus, transcript, lecture_notes, slideshow
    course_id = request.form.get('course_id', '')
    title = request.form.get('title', '')
    description = request.form.get('description', '')
    
    if not course_id:
        return jsonify({'error': 'Course ID is required'}), 400
    
    if not material_type:
        return jsonify({'error': 'Material type is required'}), 400
    
    # Save the file temporarily
    filename = secure_filename(file.filename)
    file_path = os.path.join('/tmp', filename)
    file.save(file_path)
    
    try:
        # Extract text from the file
        text = extract_text_from_file(file_path, file.content_type)
        
        # Chunk the text
        chunks = chunk_text(text)
        
        # Generate a material ID
        material_id = str(uuid.uuid4())
        
        # Connect to the database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert the material record
        cursor.execute(
            """
            INSERT INTO materials (id, file_name, file_path, file_type, file_size, material_type, course_id, processed, chunks_count)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                material_id,
                filename,
                filename,  # In a real app, this would be a storage path
                file.content_type,
                os.path.getsize(file_path),
                material_type,
                course_id,
                True,
                len(chunks)
            )
        )
        
        # For each chunk, generate embedding and store in database
        for i, chunk in enumerate(chunks):
            # Generate embedding using OpenAI
            embedding = create_embedding(chunk)
            
            # Create metadata
            metadata = {
                "materialId": material_id,
                "courseId": course_id,
                "title": title,
                "type": material_type,
                "description": description,
                "chunkIndex": i,
                "totalChunks": len(chunks)
            }
            
            # Insert embedding into the database
            chunk_id = f"{material_id}_chunk_{i}"
            cursor.execute(
                """
                INSERT INTO embeddings (id, content, embedding, metadata, created_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    chunk_id,
                    chunk,
                    embedding,
                    json.dumps(metadata),
                    time.strftime('%Y-%m-%d %H:%M:%S')
                )
            )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        # Clean up the temporary file
        os.remove(file_path)
        
        return jsonify({
            'success': True,
            'material_id': material_id,
            'chunks_processed': len(chunks)
        })
    
    except Exception as e:
        # Clean up the temporary file
        if os.path.exists(file_path):
            os.remove(file_path)
        
        return jsonify({'error': str(e)}), 500

@app.route('/api/search', methods=['POST'])
def search():
    data = request.json
    query = data.get('query', '')
    course_id = data.get('course_id', '')
    
    if not query:
        return jsonify({'error': 'Query is required'}), 400
    
    if not course_id:
        return jsonify({'error': 'Course ID is required'}), 400
    
    # Perform semantic search
    results = semantic_search(query, course_id)
    
    return jsonify({'results': results})

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    query = data.get('query', '')
    course_id = data.get('course_id', '')
    user_id = data.get('user_id', '')
    
    if not query:
        return jsonify({'error': 'Query is required'}), 400
    
    if not course_id:
        return jsonify({'error': 'Course ID is required'}), 400
    
    # Get context from vector store
    context_results = semantic_search(query, course_id, limit=5)
    context = "\n\n".join([result["content"] for result in context_results])
    
    # Create system message with context and instructions
    system_message = f"""
    You are an AI teaching assistant for a course. Answer the student's question based on the course materials.
    Here is some context from the course materials to help you answer:
    
{context}

    If the context doesn't help answer the question, you can say you don't know and suggest the student ask their professor.
    Be friendly, helpful, and concise in your responses.
    """
    
    try:
        # Generate response using OpenAI
        chat_response = client.chat.completions.create(
            model="gpt-4-turbo",  # or another appropriate model
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": query}
            ],
            max_tokens=500
        )
        
        answer = chat_response.choices[0].message.content
        
        # Store the query in the database if user_id is provided
        if user_id:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO queries (user_id, course_id, query, response, created_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (user_id, course_id, query, answer, time.strftime('%Y-%m-%d %H:%M:%S'))
            )
            conn.commit()
            cursor.close()
            conn.close()
        
        return jsonify({
            'answer': answer,
            'sources': [{"title": r["metadata"].get("title", "Unknown"), "type": r["metadata"].get("type", "Unknown")} for r in context_results]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/courses/<course_id>/materials', methods=['GET'])
def get_materials(course_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(
            """
            SELECT * FROM materials
            WHERE course_id = %s
            ORDER BY created_at DESC
            """,
            (course_id,)
        )
        materials = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify({'materials': materials})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/student/courses', methods=['GET'])
def get_student_courses():
    auth_header = request.headers.get('Authorization')
    user = get_current_user(auth_header)
    
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(
            """
            SELECT c.* FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.student_id = %s
            ORDER BY c.created_at DESC
            """,
            (user['id'],)
        )
        courses = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify({'courses': courses})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/student/queries/recent', methods=['GET'])
def get_recent_queries():
    auth_header = request.headers.get('Authorization')
    user = get_current_user(auth_header)
    
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(
            """
            SELECT q.*, c.title as course_title
            FROM queries q
            JOIN courses c ON q.course_id = c.id
            WHERE q.user_id = %s
            ORDER BY q.created_at DESC
            LIMIT 10
            """,
            (user['id'],)
        )
        queries = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify({'queries': queries})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Converted Express endpoints

# Get courses endpoint - GET /api/courses
@app.route('/api/courses', methods=['GET'])
def get_courses():
    try:
        auth_header = request.headers.get('Authorization')
        user = get_current_user(auth_header)
        
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        role = request.args.get('role', 'professor')
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if role == 'professor':
            cursor.execute(
                """
                SELECT * FROM courses
                WHERE professor_id = %s
                ORDER BY created_at DESC
                """,
                (user['id'],)
            )
            courses = cursor.fetchall()
        else:
            cursor.execute(
                """
                SELECT c.* FROM enrollments e
                JOIN courses c ON e.course_id = c.id
                WHERE e.student_id = %s
                ORDER BY c.created_at DESC
                """,
                (user['id'],)
            )
            courses = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({'courses': courses})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Create course endpoint - POST /api/courses
@app.route('/api/courses', methods=['POST'])
def create_course():
    try:
        auth_header = request.headers.get('Authorization')
        user = get_current_user(auth_header)
        
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        # Check if user is a professor
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(
            """
            SELECT role FROM profiles
            WHERE id = %s
            """,
            (user['id'],)
        )
        profile = cursor.fetchone()
        
        if not profile or profile['role'] != 'professor':
            cursor.close()
            conn.close()
            return jsonify({'error': 'Only professors can create courses'}), 403
        
        data = request.json
        
        # Validate required fields
        required_fields = ["title", "code", "term", "department"]
        for field in required_fields:
            if not data.get(field):
                cursor.close()
                conn.close()
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create the course
        cursor.execute(
            """
            INSERT INTO courses (title, code, description, term, department, professor_id)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                data['title'],
                data['code'],
                data.get('description', ''),
                data['term'],
                data['department'],
                user['id']
            )
        )
        
        course = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return jsonify({'course': course})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get materials endpoint - GET /api/materials
@app.route('/api/materials', methods=['GET'])
def get_course_materials():
    try:
        course_id = request.args.get('courseId')
        
        if not course_id:
            return jsonify({'error': 'Course ID is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(
            """
            SELECT * FROM materials
            WHERE course_id = %s
            ORDER BY created_at DESC
            """,
            (course_id,)
        )
        materials = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify({'materials': materials})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Process document endpoint - POST /api/process-document
@app.route('/api/process-document', methods=['POST'])
def process_document():
    try:
        data = request.json
        file_path = data.get('filePath')
        metadata = data.get('metadata')
        
        if not file_path or not metadata:
            return jsonify({'error': 'File path and metadata are required'}), 400
        
        if not os.environ.get('OPENAI_API_KEY'):
            return jsonify({'error': 'OpenAI API key is not configured'}), 500
        
        # Get the file from Supabase storage
        response = requests.get(
            f"{SUPABASE_URL}/storage/v1/object/course-materials/{file_path}",
            headers=get_admin_headers()
        )
        
        if response.status_code != 200:
            return jsonify({'error': 'Failed to download file'}), 500
        
        file_content = response.text
        
        # Process the document into chunks
        documents = process_documents(file_content, {
            **metadata,
            'fileId': file_path
        })
        
        # Create embeddings for the chunks
        result = create_embeddings_for_documents(documents)
        
        # Update the material status in the database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE materials
            SET processed = true, chunks_count = %s
            WHERE file_path = %s
            """,
            (len(documents), file_path)
        )
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'documentsProcessed': len(documents),
            'embeddingsCreated': result.get('count', 0)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Set up vector store - POST /api/setup-vector-store
@app.route('/api/setup-vector-store', methods=['POST'])
def setup_vector_store():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Enable pgvector extension
        cursor.execute('CREATE EXTENSION IF NOT EXISTS vector;')
        
        # Create embeddings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS embeddings (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                embedding VECTOR(1536),
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        
        # Create match_documents function
        cursor.execute('''
            CREATE OR REPLACE FUNCTION match_documents(
                query_embedding VECTOR(1536),
                match_threshold FLOAT,
                match_count INT,
                course_id TEXT
            )
            RETURNS TABLE(
                id TEXT,
                content TEXT,
                similarity FLOAT,
                metadata JSONB
            )
            LANGUAGE SQL
            AS $$
                SELECT
                    id,
                    content,
                    1 - (embedding <=> query_embedding) as similarity,
                    metadata
                FROM embeddings
                WHERE metadata->>'courseId' = course_id
                AND 1 - (embedding <=> query_embedding) > match_threshold
                ORDER BY similarity DESC
                LIMIT match_count;
            $$;
        ''')
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Vector store setup successfully'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Setup Supabase - POST /api/setup-supabase
@app.route('/api/setup-supabase', methods=['POST'])
def setup_supabase():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create necessary tables
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS profiles (
                id UUID PRIMARY KEY REFERENCES auth.users(id),
                first_name TEXT,
                last_name TEXT,
                avatar_url TEXT,
                role TEXT NOT NULL CHECK (role IN ('professor', 'student')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS courses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title TEXT NOT NULL,
                code TEXT NOT NULL,
                description TEXT,
                term TEXT NOT NULL,
                department TEXT NOT NULL,
                professor_id UUID NOT NULL REFERENCES profiles(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS enrollments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                student_id UUID NOT NULL REFERENCES profiles(id),
                course_id UUID NOT NULL REFERENCES courses(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(student_id, course_id)
            );
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS materials (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                file_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                material_type TEXT NOT NULL,
                course_id UUID NOT NULL REFERENCES courses(id),
                processed BOOLEAN DEFAULT FALSE,
                chunks_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS queries (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES profiles(id),
                course_id UUID NOT NULL REFERENCES courses(id),
                query TEXT NOT NULL,
                response TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Supabase tables created successfully'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Supabase file operations

@app.route('/api/storage/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        path = request.form.get('path', '')
        
        if file.filename == '' or not path:
            return jsonify({'error': 'No selected file or path'}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join('/tmp', filename)
        file.save(temp_path)
        
        # Upload to Supabase storage
        with open(temp_path, 'rb') as f:
            files = {'file': (filename, f)}
            response = requests.post(
                f"{SUPABASE_URL}/storage/v1/object/course-materials/{path}",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                },
                files=files
            )
        
        # Delete temp file
        os.remove(temp_path)
        
        if response.status_code != 200:
            return jsonify({'error': 'Error uploading file to Supabase'}), 500
        
        return jsonify(response.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/storage/getUrl', methods=['GET'])
def get_file_url():
    try:
        path = request.args.get('path')
        
        if not path:
            return jsonify({'error': 'Path is required'}), 400
        
        response = requests.get(
            f"{SUPABASE_URL}/storage/v1/object/public/course-materials/{path}",
            headers=get_anon_headers()
        )
        
        if response.status_code != 200:
            return jsonify({'error': 'Error getting file URL'}), 500
        
        return jsonify({
            'publicUrl': f"{SUPABASE_URL}/storage/v1/object/public/course-materials/{path}"
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/storage/delete', methods=['DELETE'])
def delete_file():
    try:
        data = request.json
        path = data.get('path')
        
        if not path:
            return jsonify({'error': 'Path is required'}), 400
        
        response = requests.delete(
            f"{SUPABASE_URL}/storage/v1/object/course-materials/{path}",
            headers=get_admin_headers()
        )
        
        if response.status_code != 200:
            return jsonify({'error': 'Error deleting file'}), 500
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000)
