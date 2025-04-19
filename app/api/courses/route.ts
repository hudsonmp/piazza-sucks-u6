import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"
import { getCurrentUser } from "@/lib/supabase-auth"

// Get courses for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role") || "professor"

    let courses

    if (role === "professor") {
      // Get courses where the user is the professor
      const { data, error } = await supabaseAdmin
        .from("courses")
        .select("*")
        .eq("professor_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      courses = data
    } else {
      // Get courses where the user is enrolled as a student
      const { data, error } = await supabaseAdmin
        .from("enrollments")
        .select(`
          course_id,
          courses:course_id (*)
        `)
        .eq("student_id", user.id)

      if (error) throw error
      courses = data.map((enrollment) => enrollment.courses)
    }

    return NextResponse.json({ courses })
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Create a new course for a professor
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a professor
    const { data: profileData } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single()

    if (!profileData || profileData.role !== "professor") {
      return NextResponse.json({ error: "Only professors can create courses" }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    const requiredFields = ["title", "code", "term", "department"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Create the course
    const { data, error } = await supabaseAdmin
      .from("courses")
      .insert({
        title: body.title,
        code: body.code,
        description: body.description || "",
        term: body.term,
        department: body.department,
        professor_id: user.id,
      })
      .select()

    if (error) throw error

    return NextResponse.json({ course: data[0] })
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
