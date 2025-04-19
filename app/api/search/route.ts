import { type NextRequest, NextResponse } from "next/server"
import { semanticSearch } from "@/lib/vector-embeddings"

export async function POST(request: NextRequest) {
  try {
    const { query, courseId } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
    }

    // Perform semantic search using our vector embeddings
    const results = await semanticSearch(query, courseId)

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
