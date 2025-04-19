import { createClient } from "@supabase/supabase-js"

// Use the environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.SUPABASE_ANON_PUBLIC || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE || ""

// Create a client with the anonymous key for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create a service client for server-side operations that need elevated privileges
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function uploadFile(file: File, path: string) {
  const { data, error } = await supabase.storage.from("course-materials").upload(path, file)

  if (error) {
    throw new Error(`Error uploading file: ${error.message}`)
  }

  return data
}

export async function getFileUrl(path: string) {
  const { data } = await supabase.storage.from("course-materials").getPublicUrl(path)

  return data.publicUrl
}

export async function listFiles(folder: string) {
  const { data, error } = await supabase.storage.from("course-materials").list(folder)

  if (error) {
    throw new Error(`Error listing files: ${error.message}`)
  }

  return data
}

export async function deleteFile(path: string) {
  const { error } = await supabase.storage.from("course-materials").remove([path])

  if (error) {
    throw new Error(`Error deleting file: ${error.message}`)
  }

  return true
}

export async function saveMaterialMetadata(metadata: any) {
  const { data, error } = await supabase.from("materials").insert(metadata).select()

  if (error) {
    throw new Error(`Error saving metadata: ${error.message}`)
  }

  return data
}

export async function getMaterials(courseId: string) {
  const { data, error } = await supabase.from("materials").select("*").eq("course_id", courseId)

  if (error) {
    throw new Error(`Error fetching materials: ${error.message}`)
  }

  return data
}
