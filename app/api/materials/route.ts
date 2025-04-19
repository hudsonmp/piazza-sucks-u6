import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    // Query materials from Supabase using the admin client
    const { data, error } = await supabaseAdmin
      .from("materials")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase query error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ materials: data })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
