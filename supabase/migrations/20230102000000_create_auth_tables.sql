-- Create users profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  full_name TEXT,
  role TEXT CHECK (role IN ('professor', 'student')) NOT NULL,
  department TEXT
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  term TEXT NOT NULL,
  department TEXT NOT NULL,
  professor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create enrollments table for student-course relationships
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE(student_id, course_id)
);

-- Create table policies
-- Profiles can be read by the user who owns the profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Profiles can be updated by the user who owns the profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Courses can be read by anyone
CREATE POLICY "Courses can be read by anyone"
  ON courses FOR SELECT
  USING (true);

-- Courses can be created by professors
CREATE POLICY "Courses can be created by professors"
  ON courses FOR INSERT
  WITH CHECK (
    auth.uid() = professor_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'professor'
    )
  );

-- Courses can be updated by the professor who owns the course
CREATE POLICY "Courses can be updated by the professor who owns the course"
  ON courses FOR UPDATE
  USING (auth.uid() = professor_id);

-- Courses can be deleted by the professor who owns the course
CREATE POLICY "Courses can be deleted by the professor who owns the course"
  ON courses FOR DELETE
  USING (auth.uid() = professor_id);

-- Enrollments can be read by the student or professor
CREATE POLICY "Enrollments can be read by the student or professor"
  ON enrollments FOR SELECT
  USING (
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = enrollments.course_id AND professor_id = auth.uid()
    )
  );

-- Enrollments can be created by the professor who owns the course
CREATE POLICY "Enrollments can be created by the professor who owns the course"
  ON enrollments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = enrollments.course_id AND professor_id = auth.uid()
    )
  );

-- Enrollments can be deleted by the professor who owns the course
CREATE POLICY "Enrollments can be deleted by the professor who owns the course"
  ON enrollments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = enrollments.course_id AND professor_id = auth.uid()
    )
  );

-- Update the materials table to include RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Materials can be read by the student enrolled in the course or the professor who owns the course
CREATE POLICY "Materials can be read by enrolled students or the professor"
  ON materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = materials.course_id AND professor_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE course_id = materials.course_id AND student_id = auth.uid()
    )
  );

-- Materials can be created, updated, or deleted by the professor who owns the course
CREATE POLICY "Materials can be created by the professor who owns the course"
  ON materials FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = materials.course_id AND professor_id = auth.uid()
    )
  );

CREATE POLICY "Materials can be updated by the professor who owns the course"
  ON materials FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = materials.course_id AND professor_id = auth.uid()
    )
  );

CREATE POLICY "Materials can be deleted by the professor who owns the course"
  ON materials FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = materials.course_id AND professor_id = auth.uid()
    )
  );
