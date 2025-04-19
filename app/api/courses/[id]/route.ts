import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"
import { getCurrentUser, hasRole, ownsCourse } from "@/lib/supabase-auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const courseId = params.id
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check course access
    const isProfessor = await hasRole("professor")
    const isOwner = await ownsCourse(courseId)

    if (isProfessor && !isOwner) {
      return NextResponse.json({ error: "You don't have access to this course" }, { status: 403 })
    }

    // If a student, check enrollment
    if (!isProfessor) {
      const { data: enrollment } = await supabaseAdmin
        .from("enrollments")
        .select("*")
        .eq("student_id", user.id)
        .eq("course_id", courseId)
        .single()

      if (!enrollment) {
        return NextResponse.json({ error: "You are not enrolled in this course" }, { status: 403 })
      }
    }

    // Get course details
    const { data: course, error } = await supabaseAdmin.from("courses").select("*").eq("id", courseId).single()

    if (error) throw error

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    return NextResponse.json({ course })
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const courseId = params.id
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is the professor who owns the course
    const { data: course } = await supabaseAdmin.from("courses").select("professor_id").eq("id", courseId).single()

    if (!course || course.professor_id !== user.id) {
      return NextResponse.json({ error: "You don't have permission to update this course" }, { status: 403 })
    }

    const body = await request.json()

    // Update the course
    const { data, error } = await supabaseAdmin
      .from("courses")
      .update({
        title: body.title,
        code: body.code,
        description: body.description || "",
        term: body.term,
        department: body.department,
      })
      .eq("id", courseId)
      .select()

    if (error) throw error

    return NextResponse.json({ course: data[0] })
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const courseId = params.id
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is the professor who owns the course
    const { data: course } = await supabaseAdmin.from("courses").select("professor_id").eq("id", courseId).single()

    if (!course || course.professor_id !== user.id) {
      return NextResponse.json({ error: "You don't have permission to delete this course" }, { status: 403 })
    }

    // Delete the course
    const { error } = await supabaseAdmin.from("courses").delete().eq("id", courseId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
