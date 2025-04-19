"use client"

import { useState } from "react"
import { ChatInterface } from "@/frontend/components/student/chat-interface"
import { CourseSelector } from "@/frontend/components/student/course-selector"
import { MaterialsList } from "@/frontend/components/student/materials-list"
import { RecentQueries } from "@/frontend/components/student/recent-queries"
import { Button } from "@/frontend/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { BookOpen, GraduationCap, MessageSquare, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/frontend/components/ui/avatar"

export default function StudentDashboard() {
  const [selectedCourse, setSelectedCourse] = useState<string>("cs101")

  // Mock course data
  const mockCourses = [
    {
      id: "cs101",
      name: "CS 101: Introduction to Programming",
      professor: "Prof. Smith",
      materials: 12,
    },
    {
      id: "math240",
      name: "MATH 240: Linear Algebra",
      professor: "Prof. Johnson",
      materials: 8,
    },
    {
      id: "phys201",
      name: "PHYS 201: Mechanics",
      professor: "Prof. Williams",
      materials: 15,
    },
  ]

  // Find the selected course
  const currentCourse = mockCourses.find(course => course.id === selectedCourse) || mockCourses[0]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">EduAI Student Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback>ST</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="container flex flex-1 gap-6 p-4 md:p-8">
        <div className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-8 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Your Courses</CardTitle>
                <CardDescription>Select a course to begin</CardDescription>
              </CardHeader>
              <CardContent>
                <CourseSelector
                  courses={mockCourses.map((course) => ({
                    id: course.id,
                    name: course.name,
                  }))}
                  selectedCourseId={selectedCourse}
                  onSelectCourse={setSelectedCourse}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/placeholder.svg?height=48&width=48" />
                    <AvatarFallback>ST</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">John Doe</p>
                    <p className="text-sm text-muted-foreground">Computer Science</p>
                    <p className="text-xs text-muted-foreground">Student ID: 12345678</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Recent Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentQueries
                  queries={[
                    "How does a for loop work in Python?",
                    "What are eigenvalues used for?",
                    "Explain Newton's First Law",
                  ]}
                  onSelectQuery={() => {}}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{currentCourse.name}</h1>
            <p className="text-muted-foreground">Instructor: {currentCourse.professor}</p>
          </div>

          <Tabs defaultValue="chat" className="space-y-6">
            <TabsList>
              <TabsTrigger value="chat">
                <MessageSquare className="mr-2 h-4 w-4" />
                Course Assistant
              </TabsTrigger>
              <TabsTrigger value="materials">
                <BookOpen className="mr-2 h-4 w-4" />
                Materials
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="space-y-6">
              <ChatInterface courseId={selectedCourse} />
            </TabsContent>

            <TabsContent value="materials" className="space-y-6">
              <MaterialsList
                materials={[
                  {
                    id: "1",
                    title: "Course Syllabus",
                    description: "Overview of the course, grading policy, and schedule",
                    type: "PDF",
                    uploadedAt: new Date("2023-09-01"),
                    url: "#",
                  },
                  {
                    id: "2",
                    title: "Week 1: Introduction",
                    description: "Introduction to the course concepts and foundational principles",
                    type: "PDF",
                    uploadedAt: new Date("2023-09-05"),
                    url: "#",
                  },
                  {
                    id: "3",
                    title: "Week 2: Core Concepts",
                    description: "Exploration of core concepts and fundamental theories",
                    type: "PDF",
                    uploadedAt: new Date("2023-09-12"),
                    url: "#",
                  },
                ]}
                courseId={selectedCourse}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 