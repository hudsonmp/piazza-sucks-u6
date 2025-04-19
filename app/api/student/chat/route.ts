import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"
import { getCurrentUser, hasRole } from "@/lib/supabase-auth"
import { semanticSearch } from "@/lib/vector-embeddings"
import OpenAI from "openai"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a student
    const isStudent = await hasRole("student")
    if (!isStudent) {
      return NextResponse.json({ error: "Only students can use this feature" }, { status: 403 })
    }

    const { message, courseId } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    // Check if student is enrolled in the course
    const { data: enrollment } = await supabaseAdmin
      .from("enrollments")
      .select("*")
      .eq("student_id", user.id)
      .eq("course_id", courseId)
      .single()

    if (!enrollment) {
      return NextResponse.json({ error: "You are not enrolled in this course" }, { status: 403 })
    }

    // Perform semantic search to find relevant content
    const searchResults = await semanticSearch(message, courseId, 3)

    // Extract content from search results
    const relevantContent = searchResults.map((result: any) => ({
      content: result.content,
      metadata: result.metadata,
    }))

    // Format sources for display
    const sources = searchResults.map((result: any) => ({
      title: result.metadata.title || "Course Material",
      type: result.metadata.type || "Document",
      excerpt: result.content.substring(0, 150) + "...",
    }))

    // Prepare context for the AI
    const context = relevantContent
      .map(
        (item: any) => `Content: ${item.content}
Source: ${item.metadata.title || "Course Material"}, Type: ${item.metadata.type || "Document"}`,
      )
      .join("\n\n")

    // Create system prompt
    const systemPrompt = `You are an AI course assistant helping a student with their questions.
Use ONLY the following context from the course materials to answer the student's question.
If the information is not in the context, say that you don't have that information in the course materials.
Do not make up information or use external knowledge.

Context from course materials:
${context}

Answer in a helpful, educational tone. Format your response using Markdown for better readability.
Include citations to the specific materials you referenced in your answer.`

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    // Get the response
    const aiResponse = completion.choices[0].message.content || "I'm sorry, I couldn't generate a response."

    // Save the query to the database for history
    await supabaseAdmin.from("student_queries").insert({
      student_id: user.id,
      course_id: courseId,
      query: message,
      response: aiResponse,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      response: aiResponse,
      sources: sources,
    })
  } catch (error: any) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "An unexpected error occurred", details: error.message }, { status: 500 })
  }
}
