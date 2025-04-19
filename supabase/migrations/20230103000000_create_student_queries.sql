-- Create student queries table
CREATE TABLE IF NOT EXISTS student_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the student_queries table
ALTER TABLE student_queries ENABLE ROW LEVEL SECURITY;

-- Create policies for student_queries
-- Students can view their own queries
CREATE POLICY "Students can view their own queries"
  ON student_queries FOR SELECT
  USING (auth.uid() = student_id);

-- Students can insert their own queries
CREATE POLICY "Students can insert their own queries"
  ON student_queries FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Professors can view queries for their courses
CREATE POLICY "Professors can view queries for their courses"
  ON student_queries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = student_queries.course_id AND professor_id = auth.uid()
    )
  );
