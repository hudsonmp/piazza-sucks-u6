"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/frontend/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/frontend/components/ui/form"
import { Input } from "@/frontend/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { supabaseAuth } from "@/lib/supabase-auth"

const authFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
})

type AuthFormValues = z.infer<typeof authFormSchema>

const defaultValues: Partial<AuthFormValues> = {
  email: "",
  password: "",
}

interface AuthFormProps {
  onSuccess?: () => void
  isSignUp?: boolean
}

export function AuthForm({ onSuccess, isSignUp = false }: AuthFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signIn, signUp } = useSupabaseAuth()

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema),
    defaultValues,
  })

  async function onSubmit(data: AuthFormValues) {
    setIsSubmitting(true)

    try {
      if (isSignUp) {
        // Sign up with Supabase
        const { data: authData, error } = await signUp(data.email, data.password, { role: "professor" })

        if (error) throw error

        // Create a profile for the new user
        if (authData?.user) {
          const { error: profileError } = await supabaseAuth.from("profiles").insert({
            id: authData.user.id,
            role: "professor",
          })

          if (profileError) {
            // Attempt to clean up the user if profile creation fails
            await supabaseAuth.auth.signOut()
            throw profileError
          }
        }

        toast({
          title: "Account created",
          description: "Your account has been created. Please check your email for confirmation.",
        })
      } else {
        // Sign in with Supabase
        const { error } = await signIn(data.email, data.password)

        if (error) throw error

        toast({
          title: "Welcome back",
          description: "You have successfully signed in.",
        })
      }

      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="professor@university.edu" type="email" {...field} />
              </FormControl>
              <FormDescription>Your university email address.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="••••••••" type="password" {...field} />
              </FormControl>
              <FormDescription>Your secure password.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 