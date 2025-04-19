import { Button } from "@/frontend/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
      <h1 className="text-4xl font-bold text-center mb-8">Welcome to EduAI</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Professor Portal</CardTitle>
            <CardDescription>Manage your courses and materials</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Create and manage courses, upload materials, and track student progress.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/professor">Enter as Professor</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Student Portal</CardTitle>
            <CardDescription>Access course materials and get assistance</CardDescription>
          </CardHeader>
          <CardContent>
            <p>View course materials, chat with the course assistant, and get help with your studies.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/student">Enter as Student</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 