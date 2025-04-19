import { type NextRequest, NextResponse } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Check if the user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get the pathname from the URL
  const { pathname } = req.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ["/", "/professor/login", "/professor/register", "/student/login", "/student/register"]
  const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  // If the path is public, allow access
  if (isPublicPath) {
    return res
  }

  // If no session and the path is not public, redirect to the landing page
  if (!session) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Get the user's role from their custom claims
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

  const userRole = profile?.role

  // Check if the user is accessing the correct area based on their role
  if (pathname.startsWith("/professor") && userRole !== "professor") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  if (pathname.startsWith("/student") && userRole !== "student") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return res
}

// Specify which paths this middleware should run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
