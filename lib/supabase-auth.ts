import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Use environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Create the Supabase client for auth operations
export const supabaseAuth = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Helper function to get the current user
export async function getCurrentUser() {
  const {
    data: { session },
    error,
  } = await supabaseAuth.auth.getSession()
  if (error) {
    console.error("Error fetching session:", error)
    return null
  }

  return session?.user || null
}

// Helper function to get the user's profile including role
export async function getUserProfile() {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabaseAuth.from("profiles").select("*").eq("id", user.id).single()

  if (error) {
    console.error("Error fetching user profile:", error)
    return null
  }

  return { ...user, profile: data }
}

// Check if the user has a specific role
export async function hasRole(role: "professor" | "student") {
  const userProfile = await getUserProfile()
  return userProfile?.profile?.role === role
}

// Check if the user owns a course
export async function ownsCourse(courseId: string) {
  const user = await getCurrentUser()
  if (!user) return false

  const { data, error } = await supabaseAuth
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .eq("professor_id", user.id)
    .single()

  if (error) return false
  return !!data
}
