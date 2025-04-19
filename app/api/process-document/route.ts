import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"
import { processDocuments, createEmbeddings } from "@/lib/vector-embeddings"

export async function POST(request: NextRequest) {
  try {
    const { filePath, metadata } = await request.json()

    if (!filePath || !metadata) {
      return NextResponse.json({ error: "File path and metadata are required" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
    }

    // Download the file from Supabase storage
    const { data: fileData, error: fileError } = await supabaseAdmin.storage.from("course-materials").download(filePath)

    if (fileError) {
      console.error("Error downloading file:", fileError)
      return NextResponse.json({ error: "Failed to download file" }, { status: 500 })
    }

    // Convert file to text
    const fileContent = await fileData.text()

    // Process the document into chunks
    const documents = await processDocuments(fileContent, {
      ...metadata,
      fileId: filePath,
    })

    // Create embeddings for the chunks
    const result = await createEmbeddings(documents)

    // Update the material status in the database
    const { error: updateError } = await supabaseAdmin
      .from("materials")
      .update({ processed: true, chunks_count: documents.length })
      .eq("file_path", filePath)

    if (updateError) {
      console.error("Error updating material status:", updateError)
    }

    return NextResponse.json({
      success: true,
      documentsProcessed: documents.length,
      embeddingsCreated: result.count,
    })
  } catch (error) {
    console.error("Document processing error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
