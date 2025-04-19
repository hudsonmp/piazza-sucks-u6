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

app = Flask(__name__)
CORS(app)

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

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
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    # Perform semantic search to find relevant content
    search_results = semantic_search(query, course_id, 3)
    
    # Extract content from search results
    relevant_content = []
    for result in search_results:
        relevant_content.append({
            'content': result['content'],
            'metadata': json.loads(result['metadata']) if isinstance(result['metadata'], str) else result['metadata']
        })
    
    # Format sources for display
    sources = []
    for result in search_results:
        metadata = json.loads(result['metadata']) if isinstance(result['metadata'], str) else result['metadata']
        sources.append({
            'title': metadata.get('title', 'Course Material'),
            'type': metadata.get('type', 'Document'),
            'excerpt': result['content'][:150] + '...' if len(result['content']) > 150 else result['content']
        })
    
    # Prepare context for the AI
    context = ""
    for item in relevant_content:
        metadata = item['metadata']
        context += f"Content: {item['content']}\n"
        context += f"Source: {metadata.get('title', 'Course Material')}, Type: {metadata.get('type', 'Document')}\n\n"
    
    # Create system prompt
    system_prompt = f"""You are an AI course assistant helping a student with their questions.
Use ONLY the following context from the course materials to answer the student's question.
If the information is not in the context, say that you don't have that information in the course materials.
Do not make up information or use external knowledge.

Context from course materials:
{context}

Answer in a helpful, educational tone. Format your response using Markdown for better readability.
Include citations to the specific materials you referenced in your answer."""
    
    # Call OpenAI API
    try:
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        # Get the response
        ai_response = completion.choices[0].message.content
        
        # Save the query to the database for history
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO student_queries (id, student_id, course_id, query, response, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (str(uuid.uuid4()), user_id, course_id, query, ai_response, time.strftime('%Y-%m-%d %H:%M:%S'))
        )
        cursor.close()
        conn.close()
        
        return jsonify({
            'response': ai_response,
            'sources': sources
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/courses/<course_id>/materials', methods=['GET'])
def get_materials(course_id):
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    # Connect to the database
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Check if the user is enrolled in the course
    cursor.execute(
        """
        SELECT * FROM enrollments
        WHERE student_id = %s AND course_id = %s
        """,
        (user_id, course_id)
    )
    
    enrollment = cursor.fetchone()
    if not enrollment:
        cursor.close()
        conn.close()
        return jsonify({'error': 'You are not enrolled in this course'}), 403
    
    # Get the materials for the course
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

@app.route('/api/student/courses', methods=['GET'])
def get_student_courses():
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    # Connect to the database
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Get the courses the student is enrolled in
    cursor.execute(
        """
        SELECT c.* FROM courses c
        JOIN enrollments e ON c.id = e.course_id
        WHERE e.student_id = %s
        ORDER BY c.created_at DESC
        """,
        (user_id,)
    )
    
    courses = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify({'courses': courses})

@app.route('/api/student/queries/recent', methods=['GET'])
def get_recent_queries():
    user_id = request.args.get('user_id')
    course_id = request.args.get('course_id')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    # Connect to the database
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Get the recent queries for the student
    if course_id:
        cursor.execute(
            """
            SELECT * FROM student_queries
            WHERE student_id = %s AND course_id = %s
            ORDER BY created_at DESC
            LIMIT 10
            """,
            (user_id, course_id)
        )
    else:
        cursor.execute(
            """
            SELECT * FROM student_queries
            WHERE student_id = %s
            ORDER BY created_at DESC
            LIMIT 10
            """,
            (user_id,)
        )
    
    queries = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify({'queries': queries})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
