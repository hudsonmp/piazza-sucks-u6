// This file provides a bridge between the Next.js frontend and the Flask backend

export async function searchCourseContent(query: string, courseId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        course_id: courseId,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to search course content")
    }

    return await response.json()
  } catch (error) {
    console.error("Error searching course content:", error)
    throw error
  }
}

export async function chatWithAssistant(query: string, courseId: string, userId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        course_id: courseId,
        user_id: userId,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to chat with assistant")
    }

    return await response.json()
  } catch (error) {
    console.error("Error chatting with assistant:", error)
    throw error
  }
}

export async function getCourseMaterials(courseId: string, userId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/courses/${courseId}/materials?user_id=${userId}`,
    )

    if (!response.ok) {
      throw new Error("Failed to get course materials")
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting course materials:", error)
    throw error
  }
}

export async function getStudentCourses(userId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/student/courses?user_id=${userId}`)

    if (!response.ok) {
      throw new Error("Failed to get student courses")
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting student courses:", error)
    throw error
  }
}

export async function getRecentQueries(userId: string, courseId?: string) {
  try {
    let url = `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/student/queries/recent?user_id=${userId}`
    if (courseId) {
      url += `&course_id=${courseId}`
    }

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error("Failed to get recent queries")
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting recent queries:", error)
    throw error
  }
}
