"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

export function SupabaseStatus() {
  const [supabaseStatus, setSupabaseStatus] = useState<"loading" | "connected" | "error">("loading")
  const [openaiStatus, setOpenaiStatus] = useState<"loading" | "available" | "unavailable">("loading")
  const [vectorStoreStatus, setVectorStoreStatus] = useState<"loading" | "setup" | "not-setup">("loading")
  const [message, setMessage] = useState("")
  const [isChecking, setIsChecking] = useState(false)

  const checkConnection = async () => {
    setIsChecking(true)
    try {
      // Check Supabase connection
      const supabaseResponse = await fetch("/api/setup-supabase")
      const supabaseData = await supabaseResponse.json()

      if (supabaseData.success) {
        setSupabaseStatus("connected")
        setMessage(`Connected to Supabase. ${supabaseData.count} materials found.`)
      } else {
        setSupabaseStatus("error")
        setMessage(`Connection error: ${supabaseData.message}`)
      }

      // Check OpenAI API key
      const openaiResponse = await fetch("/api/check-openai")
      const openaiData = await openaiResponse.json()
      setOpenaiStatus(openaiData.available ? "available" : "unavailable")

      // Check vector store setup
      if (openaiData.available) {
        const vectorStoreResponse = await fetch("/api/setup-vector-store")
        const vectorStoreData = await vectorStoreResponse.json()
        setVectorStoreStatus(vectorStoreData.success ? "setup" : "not-setup")
      }
    } catch (error) {
      setSupabaseStatus("error")
      setMessage(`Failed to check connection: ${error}`)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <div className="space-y-4">
      <Alert
        variant={supabaseStatus === "connected" ? "default" : supabaseStatus === "error" ? "destructive" : "outline"}
      >
        {supabaseStatus === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        {supabaseStatus === "connected" && <CheckCircle className="h-4 w-4" />}
        {supabaseStatus === "error" && <AlertCircle className="h-4 w-4" />}
        <AlertTitle>
          {supabaseStatus === "connected" && "Connected to Supabase"}
          {supabaseStatus === "error" && "Connection Error"}
          {supabaseStatus === "loading" && "Checking Supabase Connection"}
        </AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>

      <Alert
        variant={openaiStatus === "available" ? "default" : openaiStatus === "unavailable" ? "warning" : "outline"}
      >
        {openaiStatus === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        {openaiStatus === "available" && <CheckCircle className="h-4 w-4" />}
        {openaiStatus === "unavailable" && <AlertCircle className="h-4 w-4" />}
        <AlertTitle>
          {openaiStatus === "available" && "OpenAI API Key Available"}
          {openaiStatus === "unavailable" && "OpenAI API Key Not Configured"}
          {openaiStatus === "loading" && "Checking OpenAI API Key"}
        </AlertTitle>
        <AlertDescription>
          {openaiStatus === "available" && "Vector embeddings and semantic search are available."}
          {openaiStatus === "unavailable" &&
            "Vector embeddings and semantic search will not work without an OpenAI API key."}
          {openaiStatus === "loading" && "Checking if OpenAI API key is configured..."}
        </AlertDescription>
      </Alert>

      {openaiStatus === "available" && (
        <Alert
          variant={
            vectorStoreStatus === "setup" ? "default" : vectorStoreStatus === "not-setup" ? "warning" : "outline"
          }
        >
          {vectorStoreStatus === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
          {vectorStoreStatus === "setup" && <CheckCircle className="h-4 w-4" />}
          {vectorStoreStatus === "not-setup" && <AlertCircle className="h-4 w-4" />}
          <AlertTitle>
            {vectorStoreStatus === "setup" && "Vector Store Setup Complete"}
            {vectorStoreStatus === "not-setup" && "Vector Store Setup Required"}
            {vectorStoreStatus === "loading" && "Checking Vector Store Setup"}
          </AlertTitle>
          <AlertDescription>
            {vectorStoreStatus === "setup" && "The vector store is set up and ready for semantic search."}
            {vectorStoreStatus === "not-setup" && "The vector store needs to be set up for semantic search to work."}
            {vectorStoreStatus === "loading" && "Checking vector store setup..."}
          </AlertDescription>
          {vectorStoreStatus === "not-setup" && (
            <Button size="sm" className="mt-2" onClick={() => fetch("/api/setup-vector-store")}>
              Setup Vector Store
            </Button>
          )}
        </Alert>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={checkConnection}
        disabled={isChecking}
        className="flex items-center gap-2"
      >
        {isChecking && <Loader2 className="h-3 w-3 animate-spin" />}
        {isChecking ? "Checking..." : "Check Connection"}
      </Button>
    </div>
  )
}
