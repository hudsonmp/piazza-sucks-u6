"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CourseUploadDashboard } from "@/components/course-upload-dashboard"
import { Button } from "@/components/ui/button"
import { supabaseAuth } from "@/lib/supabase-auth"
import { LogOut } from "lucide-react"

export default function ProfessorDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      const {
        data: { user: currentUser },
      } = await supabaseAuth.auth.getUser()

      if (!currentUser) {
        router.push("/professor/login")
        return
      }

      // Get the user profile including role
      const { data: profile } = await supabaseAuth.from("profiles").select("*").eq("id", currentUser.id).single()

      setUser({ ...currentUser, profile })
      setLoading(false)
    }

    getUser()
  }, [router])

  const handleSignOut = async () => {
    await supabaseAuth.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return <div className="container mx-auto py-6">Loading...</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Professor Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {user?.profile?.full_name || user?.email}</p>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <CourseUploadDashboard />
    </div>
  )
}
