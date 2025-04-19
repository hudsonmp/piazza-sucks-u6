"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2, FileText, ThumbsUp, ThumbsDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { Button } from "@/frontend/components/ui/button"
import { Textarea } from "@/frontend/components/ui/textarea"
import { ScrollArea } from "@/frontend/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/frontend/components/ui/avatar"
import { Badge } from "@/frontend/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs"
import ReactMarkdown from "react-markdown"

interface ChatInterfaceProps {
  courseId: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  sources?: {
    title: string
    type: string
    excerpt: string
  }[]
}

export function ChatInterface({ courseId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState("chat")

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Reset messages when course changes
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "👋 Welcome to your course assistant! Ask me anything about your course materials.",
        timestamp: new Date(),
      },
    ])
  }, [courseId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Call the API endpoint
      const response = await fetch("/api/student/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          courseId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        sources: data.sources,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error:", error)

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
      <Card className="flex h-full flex-col">
        <CardHeader className="px-4 pb-0 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Course Assistant</CardTitle>
              <CardDescription>Ask questions about your course materials</CardDescription>
            </div>
            <TabsList>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>

        <TabsContent value="chat" className="flex-1 px-0">
          <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 pb-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`flex max-w-[80%] flex-col space-y-2 rounded-lg p-4 ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {message.role === "assistant" ? (
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>AI</AvatarFallback>
                            <AvatarImage src="/placeholder.svg?height=40&width=40" />
                          </Avatar>
                        ) : (
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>U</AvatarFallback>
                            <AvatarImage src="/placeholder.svg?height=40&width=40" />
                          </Avatar>
                        )}
                        <span className="text-xs font-medium">
                          {message.role === "assistant" ? "Assistant" : "You"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className={`prose prose-sm ${message.role === "user" ? "text-primary-foreground" : ""}`}>
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>

                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs font-medium">Sources:</p>
                          <div className="space-y-1">
                            {message.sources.map((source, index) => (
                              <div key={index} className="rounded border bg-background p-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1">
                                    <FileText className="h-3 w-3" />
                                    <span className="font-medium">{source.title}</span>
                                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                                      {source.type}
                                    </Badge>
                                  </div>
                                </div>
                                <p className="mt-1 text-muted-foreground line-clamp-2">{source.excerpt}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {message.role === "assistant" && message.id !== "welcome" && (
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
              <Textarea
                placeholder="Ask a question about your course materials..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-10 flex-1 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </CardFooter>
        </TabsContent>

        <TabsContent value="materials" className="flex-1">
          <CardContent className="p-4">
            <div className="rounded-lg border p-4">
              <h3 className="text-lg font-medium">Course Materials</h3>
              <p className="text-sm text-muted-foreground">
                The assistant has access to the following course materials:
              </p>

              <div className="mt-4 space-y-2">
                <div className="rounded-md border p-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">Course Syllabus</span>
                  </div>
                </div>
                <div className="rounded-md border p-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">Lecture Notes</span>
                  </div>
                </div>
                <div className="rounded-md border p-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">Assignment Instructions</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  The assistant uses AI to search through these materials and provide relevant answers to your
                  questions.
                </p>
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Card>
    </Tabs>
  )
}
