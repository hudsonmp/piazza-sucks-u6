import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"
import { getCurrentUser, hasRole, ownsCourse } from "@/lib/supabase-auth"

// Get enrollments for a course
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const courseId = params.id
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only the professor who owns the course can view all enrollments
    const isProfessor = await hasRole("professor")
    const isOwner = await ownsCourse(courseId)

    if (!isProfessor || !isOwner) {
      return NextResponse.json({ error: "You don't have permission to view enrollments" }, { status: 403 })
    }

    // Get enrollments with student profiles
    const { data, error } = await supabaseAdmin
      .from("enrollments")
      .select(`
        id,
        created_at,
        student:student_id (
          id,
          email,
          profiles:profiles (
            full_name
          )
        )
      `)
      .eq("course_id", courseId)

    if (error) throw error

    return NextResponse.json({ enrollments: data })
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Enroll students in a course
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const courseId = params.id
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only the professor who owns the course can enroll students
    const isProfessor = await hasRole("professor")
    const isOwner = await ownsCourse(courseId)

    if (!isProfessor || !isOwner) {
      return NextResponse.json({ error: "You don't have permission to enroll students" }, { status: 403 })
    }

    const body = await request.json()

    // Validate student email
    if (!body.email) {
      return NextResponse.json({ error: "Student email is required" }, { status: 400 })
    }

    // Find the student by email
    const { data: student, error: studentError } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("email", body.email)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    if (student.role !== "student") {
      return NextResponse.json({ error: "User is not a student" }, { status: 400 })
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .eq("student_id", student.id)
      .eq("course_id", courseId)
      .single()

    if (existingEnrollment) {
      return NextResponse.json({ error: "Student is already enrolled in this course" }, { status: 400 })
    }

    // Create the enrollment
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from("enrollments")
      .insert({
        student_id: student.id,
        course_id: courseId,
      })
      .select()

    if (enrollmentError) throw enrollmentError

    return NextResponse.json({ enrollment: enrollment[0] })
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
