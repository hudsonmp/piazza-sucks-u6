import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"
import { getCurrentUser, hasRole, ownsCourse } from "@/lib/supabase-auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const materialType = formData.get("materialType") as string
    const courseId = formData.get("courseId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    // Check if user is the professor who owns the course
    const isProfessor = await hasRole("professor")
    const isOwner = await ownsCourse(courseId)

    if (!isProfessor || !isOwner) {
      return NextResponse.json(
        { error: "You don't have permission to upload materials to this course" },
        { status: 403 },
      )
    }

    // Generate a unique file path
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `${courseId}/${materialType}/${fileName}`

    // Upload to Supabase Storage using the admin client for server operations
    const { data, error } = await supabaseAdmin.storage.from("course-materials").upload(filePath, file)

    if (error) {
      console.error("Supabase storage error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Save metadata to Supabase database
    const metadata = {
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      material_type: materialType,
      course_id: courseId,
      processed: false,
      chunks_count: 0,
      created_at: new Date().toISOString(),
    }

    const { data: metadataData, error: metadataError } = await supabaseAdmin.from("materials").insert(metadata).select()

    if (metadataError) {
      console.error("Supabase database error:", metadataError)
      return NextResponse.json({ error: metadataError.message }, { status: 500 })
    }

    // Trigger document processing if OpenAI API key is available
    if (process.env.OPENAI_API_KEY) {
      // In a production app, this would be a background job
      // For simplicity, we're making a direct API call
      fetch(`${request.nextUrl.origin}/api/process-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filePath,
          metadata: {
            title: file.name,
            type: materialType,
            courseId,
          },
        }),
      }).catch((error) => {
        console.error("Error triggering document processing:", error)
      })
    }

    return NextResponse.json({
      success: true,
      file: {
        id: metadataData[0].id,
        name: file.name,
        path: filePath,
        type: materialType,
        size: file.size,
        processing: process.env.OPENAI_API_KEY ? true : false,
      },
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
