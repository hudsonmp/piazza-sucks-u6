"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/frontend/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/frontend/components/ui/form"
import { Input } from "@/frontend/components/ui/input"
import { Textarea } from "@/frontend/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { supabaseAuth } from "@/lib/supabase-auth"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"

const courseFormSchema = z.object({
  title: z.string().min(3, {
    message: "Course title must be at least 3 characters.",
  }),
  code: z.string().min(2, {
    message: "Course code is required.",
  }),
  description: z.string().optional(),
  term: z.string().min(2, {
    message: "Term is required (e.g., Fall 2023).",
  }),
  department: z.string().min(2, {
    message: "Department is required.",
  }),
})

type CourseFormValues = z.infer<typeof courseFormSchema>

const defaultValues: Partial<CourseFormValues> = {
  title: "",
  code: "",
  description: "",
  term: "",
  department: "",
}

interface CourseFormProps {
  existingCourse?: any
  onSuccess?: () => void
}

export function CourseForm({ existingCourse, onSuccess }: CourseFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useSupabaseAuth()

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: existingCourse || defaultValues,
  })

  async function onSubmit(data: CourseFormValues) {
    setIsSubmitting(true)

    try {
      if (!user) {
        throw new Error("You must be logged in to create a course")
      }

      if (existingCourse) {
        // Update existing course
        const { error } = await supabaseAuth
          .from("courses")
          .update({
            title: data.title,
            code: data.code,
            description: data.description,
            term: data.term,
            department: data.department,
          })
          .eq("id", existingCourse.id)

        if (error) throw error
      } else {
        // Create new course
        const { error } = await supabaseAuth.from("courses").insert({
          title: data.title,
          code: data.code,
          description: data.description || "",
          term: data.term,
          department: data.department,
          professor_id: user.id,
        })

        if (error) throw error
      }

      toast({
        title: existingCourse ? "Course updated" : "Course created",
        description: existingCourse
          ? "Your course settings have been updated successfully."
          : "Your new course has been created successfully.",
      })

      if (onSuccess) {
        onSuccess()
      }

      if (!existingCourse) {
        // Reset the form if creating a new course
        form.reset(defaultValues)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Title</FormLabel>
                <FormControl>
                  <Input placeholder="Introduction to Computer Science" {...field} />
                </FormControl>
                <FormDescription>The full title of your course.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Code</FormLabel>
                <FormControl>
                  <Input placeholder="CS101" {...field} />
                </FormControl>
                <FormDescription>The course code or number.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A brief description of the course content and objectives."
                  className="min-h-[120px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>Provide a brief overview of your course.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="term"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Term</FormLabel>
                <FormControl>
                  <Input placeholder="Fall 2023" {...field} />
                </FormControl>
                <FormDescription>The academic term for this course.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="Computer Science" {...field} />
                </FormControl>
                <FormDescription>The department offering this course.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Saving..." : existingCourse ? "Update Course" : "Create Course"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
