"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/frontend/components/professor/app-sidebar"
import { CourseUploadDashboard } from "@/frontend/components/professor/course-upload-dashboard"
import { CourseForm } from "@/frontend/components/professor/course-form"
import { AuthForm } from "@/frontend/components/professor/auth-form"
import { Button } from "@/frontend/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs"
import { supabaseAuth } from "@/lib/supabase-auth"
import { Loader2 } from "lucide-react"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"

export default function ProfessorDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const { user, loading, signOut } = useSupabaseAuth()

  // Fetch courses when user changes
  useEffect(() => {
    if (user) {
      fetchCourses(user.id)
    } else {
      setCourses([])
    }
  }, [user])
  
  // Fetch courses for the user
  const fetchCourses = async (userId: string) => {
    try {
      const { data, error } = await supabaseAuth
        .from("courses")
        .select("*")
        .eq("professor_id", userId)
        
      if (error) throw error
      
      setCourses(data || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }
  
  // Handle course added
  const handleCourseAdded = () => {
    if (user) {
      fetchCourses(user.id)
      setShowAddCourse(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  // If no user is logged in, show authentication screen
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
              {authMode === "signin" ? "Sign in to your account" : "Create a new account"}
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {authMode === "signin"
                ? "Sign in to manage your courses and materials"
                : "Create an account to start using the platform"}
            </p>
          </div>
          
          <div className="mt-8 bg-card rounded-lg border p-6 shadow-sm">
            <AuthForm 
              isSignUp={authMode === "signup"} 
            />
            
            <div className="mt-4 text-center">
              <Button 
                variant="link" 
                onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
              >
                {authMode === "signin" 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Calculate summary data
  const totalStudents = courses.reduce((acc, course) => {
    // We'll need to count enrollments in a real implementation
    return acc + (course.enrollment_count || 0)
  }, 0)
  
  const totalMaterials = courses.reduce((acc, course) => {
    // We'll need to count materials in a real implementation
    return acc + (course.materials_count || 0)
  }, 0)

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Professor Dashboard</h1>
            <p className="text-muted-foreground">Manage your courses and materials</p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => setShowAddCourse(true)} disabled={showAddCourse}>
              Add New Course
            </Button>
            <Button variant="outline" onClick={signOut}>
              Logout
            </Button>
          </div>
        </div>

        {showAddCourse ? (
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create New Course</h2>
              <Button variant="outline" onClick={() => setShowAddCourse(false)}>
                Cancel
              </Button>
            </div>
            <CourseForm
              onSuccess={handleCourseAdded}
            />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="materials">Course Materials</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="text-lg font-medium">Total Courses</h3>
                  <p className="mt-2 text-3xl font-bold">{courses.length}</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="text-lg font-medium">Total Students</h3>
                  <p className="mt-2 text-3xl font-bold">{totalStudents}</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="text-lg font-medium">Total Materials</h3>
                  <p className="mt-2 text-3xl font-bold">{totalMaterials}</p>
                </div>
              </div>

              <div className="rounded-lg border">
                <div className="border-b p-4">
                  <h3 className="text-lg font-medium">Recent Courses</h3>
                </div>
                <div className="p-4">
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <div key={course.id} className="mb-4 rounded-lg border p-4 last:mb-0">
                        <h4 className="font-medium">{course.title}</h4>
                        <p className="text-sm text-muted-foreground">{course.description}</p>
                        <div className="mt-2 flex gap-4 text-sm">
                          <span>{course.term}</span>
                          <span>{course.department}</span>
                          <span>{course.code}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No courses yet. Add your first course to get started.</p>
                      <Button 
                        className="mt-4" 
                        variant="outline" 
                        onClick={() => setShowAddCourse(true)}
                      >
                        Add Course
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="courses">
              <CourseUploadDashboard />
            </TabsContent>

            <TabsContent value="materials">
              <div className="rounded-lg border">
                <div className="border-b p-4">
                  <h3 className="text-lg font-medium">Course Materials</h3>
                </div>
                <div className="p-4">
                  <p>Select a course to view or upload materials.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
} 