-- Execute the function to enable pgvector
SELECT enable_pgvector_extension();

-- Execute the function to create the embeddings table
SELECT create_embeddings_table();

-- Execute the function to create the materials table
SELECT create_materials_table_if_not_exists();

-- Execute the function to create the match_documents function
SELECT create_match_documents_function();

-- Create an index for faster vector similarity search
CREATE INDEX IF NOT EXISTS embeddings_embedding_idx ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Update course_id column in materials table to UUID if not already
ALTER TABLE materials ALTER COLUMN course_id TYPE UUID USING course_id::UUID;

-- Ensure materials table has RLS enabled
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Ensure embeddings table has RLS enabled
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Create policies for materials
CREATE POLICY IF NOT EXISTS "Materials can be read by enrolled students or the professor"
  ON materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = materials.course_id::UUID AND professor_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE course_id = materials.course_id::UUID AND student_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Materials can be created by the professor who owns the course"
  ON materials FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = materials.course_id::UUID AND professor_id = auth.uid()
    )
  );

-- Create policies for embeddings
CREATE POLICY IF NOT EXISTS "Embeddings can be read by anyone who can access the course"
  ON embeddings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id::TEXT = (embeddings.metadata->>'courseId')::UUID::TEXT AND c.professor_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE c.id::TEXT = (embeddings.metadata->>'courseId')::UUID::TEXT AND e.student_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Embeddings can be created by the professor who owns the course"
  ON embeddings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id::TEXT = (embeddings.metadata->>'courseId')::UUID::TEXT AND professor_id = auth.uid()
    )
  ); 