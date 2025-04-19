"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CourseSelector } from "@/components/student/course-selector"
import { MaterialsList } from "@/components/student/materials-list"
import { ChatInterface } from "@/components/student/chat-interface"
import { RecentQueries } from "@/components/student/recent-queries"
import { supabaseAuth } from "@/lib/supabase-auth"
import { Loader2 } from "lucide-react"

export default function StudentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])

  useEffect(() => {
    async function getUser() {
      const {
        data: { user: currentUser },
      } = await supabaseAuth.auth.getUser()

      if (!currentUser) {
        router.push("/student/login")
        return
      }

      // Get the user profile including role
      const { data: profile } = await supabaseAuth.from("profiles").select("*").eq("id", currentUser.id).single()

      setUser({ ...currentUser, profile })

      // Get enrolled courses
      const { data: enrollments } = await supabaseAuth
        .from("enrollments")
        .select(`
          course_id,
          courses:course_id (*)
        `)
        .eq("student_id", currentUser.id)

      if (enrollments && enrollments.length > 0) {
        const courses = enrollments.map((e) => e.courses)
        setEnrolledCourses(courses)
        setSelectedCourse(courses[0].id)
      }

      setLoading(false)
    }

    getUser()
  }, [router])

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId)
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-full flex-col">
          <div className="border-b p-4">
            <CourseSelector
              courses={enrolledCourses}
              selectedCourse={selectedCourse}
              onCourseChange={handleCourseChange}
            />
          </div>

          <div className="grid flex-1 grid-cols-1 gap-4 overflow-auto p-4 md:grid-cols-3">
            <div className="col-span-2 flex flex-col space-y-4">
              {selectedCourse ? (
                <>
                  <ChatInterface courseId={selectedCourse} />
                </>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <div>
                    <h3 className="text-lg font-medium">No Course Selected</h3>
                    <p className="text-sm text-muted-foreground">
                      Please select a course to view materials and ask questions.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-4">
              {selectedCourse && (
                <>
                  <MaterialsList courseId={selectedCourse} />
                  <RecentQueries courseId={selectedCourse} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
