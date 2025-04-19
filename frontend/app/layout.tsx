import { Inter } from "next/font/google"
import "../styles/globals.css"
import { ThemeProvider } from "@/frontend/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "EduAI - Course Assistant",
  description: "AI-powered course assistant for students and professors",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
} 