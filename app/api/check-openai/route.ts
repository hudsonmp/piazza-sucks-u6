import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY

    return NextResponse.json({
      available: !!openaiApiKey,
      message: openaiApiKey ? "OpenAI API key is configured" : "OpenAI API key is not configured",
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        available: false,
        message: "An unexpected error occurred",
        error: String(error),
      },
      { status: 500 },
    )
  }
}
