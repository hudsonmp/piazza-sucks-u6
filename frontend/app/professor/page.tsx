"use client"

import { useState } from "react"
import { AppSidebar } from "@/frontend/components/professor/app-sidebar"
import { CourseUploadDashboard } from "@/frontend/components/professor/course-upload-dashboard"
import { CourseForm } from "@/frontend/components/professor/course-form"
import { Button } from "@/frontend/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs"

export default function ProfessorDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showAddCourse, setShowAddCourse] = useState(false)

  // Mock course data
  const mockCourses = [
    {
      id: "1",
      name: "CS 101: Introduction to Programming",
      description: "An introduction to programming concepts and practices.",
      enrollmentCount: 45,
      materialsCount: 12,
    },
    {
      id: "2",
      name: "MATH 240: Linear Algebra",
      description: "A study of vector spaces, linear transformations, matrices, and systems of linear equations.",
      enrollmentCount: 32,
      materialsCount: 8,
    },
    {
      id: "3",
      name: "PHYS 201: Mechanics",
      description: "Introduction to classical mechanics, including Newton's laws and conservation principles.",
      enrollmentCount: 28,
      materialsCount: 15,
    },
  ]

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Professor Dashboard</h1>
            <p className="text-muted-foreground">Manage your courses and materials</p>
          </div>
          
          <Button onClick={() => setShowAddCourse(true)} disabled={showAddCourse}>
            Add New Course
          </Button>
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
              onSuccess={() => {
                // This would normally save the course
                setShowAddCourse(false)
              }}
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
                  <p className="mt-2 text-3xl font-bold">{mockCourses.length}</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="text-lg font-medium">Total Students</h3>
                  <p className="mt-2 text-3xl font-bold">
                    {mockCourses.reduce((acc, course) => acc + course.enrollmentCount, 0)}
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="text-lg font-medium">Total Materials</h3>
                  <p className="mt-2 text-3xl font-bold">
                    {mockCourses.reduce((acc, course) => acc + course.materialsCount, 0)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border">
                <div className="border-b p-4">
                  <h3 className="text-lg font-medium">Recent Courses</h3>
                </div>
                <div className="p-4">
                  {mockCourses.map((course) => (
                    <div key={course.id} className="mb-4 rounded-lg border p-4 last:mb-0">
                      <h4 className="font-medium">{course.name}</h4>
                      <p className="text-sm text-muted-foreground">{course.description}</p>
                      <div className="mt-2 flex gap-4 text-sm">
                        <span>{course.enrollmentCount} students</span>
                        <span>{course.materialsCount} materials</span>
                      </div>
                    </div>
                  ))}
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