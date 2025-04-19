import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function RegisterSuccess() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 items-center">
          <CheckCircle className="h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-2xl text-center">Registration Successful</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            Your student account has been created successfully. You can now log in to access your courses.
          </p>
          <p className="text-sm text-muted-foreground">
            If you provided an email, please check your inbox for a confirmation email.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button asChild className="w-full">
            <Link href="/student/login">Go to Login</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/">Return to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
