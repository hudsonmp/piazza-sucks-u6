import Link from "next/link"
import { GraduationCap, BookOpen } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/50 px-4">
      <div className="max-w-3xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">Welcome to EduAI</h1>
        <p className="text-xl text-muted-foreground">
          An AI-enhanced course management platform for professors and students
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 max-w-4xl w-full">
        <Card className="transition-all hover:shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>For Professors</CardTitle>
            <CardDescription>Manage your courses and materials with AI assistance</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Upload and organize course materials, create AI-enhanced learning experiences, and streamline student
              interactions.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button asChild>
              <Link href="/professor/login">Log In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/professor/register">Register</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="transition-all hover:shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>For Students</CardTitle>
            <CardDescription>Access course materials and get AI-assisted learning</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Access course materials, get personalized learning assistance, and participate in discussions with
              AI-enhanced support.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button asChild>
              <Link href="/student/login">Log In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/student/register">Register</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
