-- Enable the pgvector extension
CREATE OR REPLACE FUNCTION enable_pgvector_extension()
RETURNS VOID AS $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
END;
$$ LANGUAGE plpgsql;

-- Create the embeddings table
CREATE OR REPLACE FUNCTION create_embeddings_table()
RETURNS VOID AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS embeddings (
    id TEXT PRIMARY KEY,
    content TEXT,
    embedding VECTOR(1536),  -- OpenAI Ada embeddings are 1536 dimensions
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Create the materials table if it doesn't exist
CREATE OR REPLACE FUNCTION create_materials_table_if_not_exists()
RETURNS VOID AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    material_type TEXT,
    course_id TEXT,
    processed BOOLEAN DEFAULT FALSE,
    chunks_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to match documents based on embedding similarity
CREATE OR REPLACE FUNCTION create_match_documents_function()
RETURNS VOID AS $$
BEGIN
  CREATE OR REPLACE FUNCTION match_documents(
    query_embedding VECTOR(1536),
    match_threshold FLOAT,
    match_count INT,
    course_id TEXT
  )
  RETURNS TABLE (
    id TEXT,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
  )
  LANGUAGE plpgsql
  AS $$
  BEGIN
    RETURN QUERY
    SELECT
      e.id,
      e.content,
      e.metadata,
      1 - (e.embedding <=> query_embedding) AS similarity
    FROM embeddings e
    WHERE 
      1 - (e.embedding <=> query_embedding) > match_threshold
      AND (course_id = 'all' OR e.metadata->>'courseId' = course_id)
    ORDER BY similarity DESC
    LIMIT match_count;
  END;
  $$;
END;
$$ LANGUAGE plpgsql;
