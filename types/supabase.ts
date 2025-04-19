export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string | null
          role: "professor" | "student"
          department: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          role: "professor" | "student"
          department?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          role?: "professor" | "student"
          department?: string | null
        }
      }
      courses: {
        Row: {
          id: string
          created_at: string
          title: string
          code: string
          description: string | null
          term: string
          department: string
          professor_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          code: string
          description?: string | null
          term: string
          department: string
          professor_id: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          code?: string
          description?: string | null
          term?: string
          department?: string
          professor_id?: string
        }
      }
      materials: {
        Row: {
          id: string
          file_name: string
          file_path: string
          file_type: string | null
          file_size: number | null
          material_type: string | null
          course_id: string
          processed: boolean
          chunks_count: number
          created_at: string
        }
        Insert: {
          id?: string
          file_name: string
          file_path: string
          file_type?: string | null
          file_size?: number | null
          material_type?: string | null
          course_id: string
          processed?: boolean
          chunks_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          file_name?: string
          file_path?: string
          file_type?: string | null
          file_size?: number | null
          material_type?: string | null
          course_id?: string
          processed?: boolean
          chunks_count?: number
          created_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          created_at: string
          student_id: string
          course_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          student_id: string
          course_id: string
        }
        Update: {
          id?: string
          created_at?: string
          student_id?: string
          course_id?: string
        }
      }
    }
  }
}
