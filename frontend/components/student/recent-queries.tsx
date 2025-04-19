"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { Button } from "@/frontend/components/ui/button"
import { ScrollArea } from "@/frontend/components/ui/scroll-area"

interface RecentQueriesProps {
  courseId: string
}

interface Query {
  id: string
  query: string
  timestamp: Date
}

export function RecentQueries({ courseId }: RecentQueriesProps) {
  const [recentQueries, setRecentQueries] = useState<Query[]>([
    {
      id: "1",
      query: "What are the key concepts in chapter 3?",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      id: "2",
      query: "When is the midterm exam?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: "3",
      query: "Explain the difference between supervised and unsupervised learning",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
  ])

  // In a real implementation, you would fetch recent queries from the backend
  useEffect(() => {
    // This would be replaced with an actual API call
    // Example: fetchRecentQueries(courseId)
  }, [courseId])

  const handleQueryClick = (query: string) => {
    // This would trigger the query in the chat interface
    // You could use a global state manager or event system
    console.log("Query clicked:", query)

    // For now, we'll just dispatch a custom event
    const event = new CustomEvent("student:query", { detail: { query } })
    window.dispatchEvent(event)
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Recent Queries</CardTitle>
        <CardDescription>Questions you've asked recently</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-2">
            {recentQueries.map((query) => (
              <Button
                key={query.id}
                variant="ghost"
                className="w-full justify-start text-left"
                onClick={() => handleQueryClick(query.query)}
              >
                <div className="flex items-start">
                  <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="line-clamp-1">{query.query}</span>
                    <span className="text-xs text-muted-foreground">{query.timestamp.toLocaleString()}</span>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
