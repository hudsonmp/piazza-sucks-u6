import { type NextRequest, NextResponse } from "next/server"
import { setupVectorStore } from "@/lib/vector-embeddings"

export async function GET(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: "OpenAI API key is not configured",
        },
        { status: 500 },
      )
    }

    const result = await setupVectorStore()

    return NextResponse.json({
      success: result.success,
      message: result.success ? "Vector store setup successfully" : "Vector store setup completed with some issues",
      details: result,
    })
  } catch (error) {
    console.error("Vector store setup error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred during vector store setup",
        error: String(error),
      },
      { status: 500 },
    )
  }
}
