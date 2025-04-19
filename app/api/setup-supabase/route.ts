import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"

export async function GET(request: NextRequest) {
  try {
    // Check if we can connect to Supabase
    const { data, error } = await supabaseAdmin.from("materials").select("count()", { count: "exact" })

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to connect to Supabase",
          error: error.message,
        },
        { status: 500 },
      )
    }

    // Create the necessary tables and storage buckets if they don't exist
    // This is a simplified version - in a real app, you'd use migrations

    // 1. Create materials table if it doesn't exist
    const { error: createTableError } = await supabaseAdmin.rpc("create_materials_table_if_not_exists")

    // 2. Create storage bucket if it doesn't exist
    const { error: createBucketError } = await supabaseAdmin.storage.createBucket("course-materials", {
      public: false,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
    })

    return NextResponse.json({
      success: true,
      message: "Supabase connection successful",
      count: data?.[0]?.count || 0,
      tableCreated: !createTableError,
      bucketCreated: !createBucketError,
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred during setup",
        error: String(error),
      },
      { status: 500 },
    )
  }
}
