"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Cloud, File, Loader2, UploadCloud, X } from "lucide-react"
import { Progress } from "@/frontend/components/ui/progress"
import { Button } from "@/frontend/components/ui/button"
import { Card } from "@/frontend/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select"
import { Label } from "@/frontend/components/ui/label"

type FileWithPreview = File & {
  preview?: string
  id: string
  progress: number
  type: string
  materialType: string
}

type FileUploaderProps = {
  courseId?: string
  onUploadComplete: (files: any[]) => void
}

export function FileUploader({ courseId: propsCourseId, onUploadComplete }: FileUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [courseId, setCourseId] = useState<string>(propsCourseId || "")
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)

  // Fetch courses owned by the professor
  useEffect(() => {
    async function fetchCourses() {
      if (propsCourseId) {
        setCourseId(propsCourseId)
        return
      }

      setIsLoadingCourses(true)

      try {
        const response = await fetch("/api/courses?role=professor")
        const data = await response.json()

        if (data.courses) {
          setCourses(data.courses)

          // Set the first course as default if not provided in props
          if (data.courses.length > 0 && !courseId) {
            setCourseId(data.courses[0].id)
          }
        }
      } catch (error) {
        console.error("Error fetching courses:", error)
      } finally {
        setIsLoadingCourses(false)
      }
    }

    fetchCourses()
  }, [propsCourseId, courseId])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) =>
      Object.assign(file, {
        id: Math.random().toString(36).substring(2),
        progress: 0,
        materialType: "other",
        preview: URL.createObjectURL(file),
      }),
    )
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "text/plain": [".txt"],
      "application/json": [".json"],
    },
  })

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const filtered = prev.filter((file) => file.id !== id)
      return filtered
    })
  }

  const updateFileType = (id: string, materialType: string) => {
    setFiles((prev) => prev.map((file) => (file.id === id ? { ...file, materialType } : file)))
  }

  const uploadFile = async (file: FileWithPreview) => {
    if (!courseId) {
      throw new Error("Please select a course")
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("materialType", file.materialType)
    formData.append("courseId", courseId)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to upload file")
    }

    return await response.json()
  }

  const uploadFiles = async () => {
    setIsUploading(true)

    if (!courseId) {
      alert("Please select a course")
      setIsUploading(false)
      return
    }

    try {
      // Start progress updates
      const interval = setInterval(() => {
        setFiles((prev) =>
          prev.map((file) => ({
            ...file,
            progress: Math.min(file.progress + 10, 90), // Only go up to 90% to show real completion later
          })),
        )
      }, 300)

      // Upload files one by one
      const uploadedFiles = []
      for (const file of files) {
        try {
          const result = await uploadFile(file)
          uploadedFiles.push(result.file)
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error)
          // Continue with other files
        }
      }

      clearInterval(interval)

      // Set all files to 100% progress
      setFiles((prev) =>
        prev.map((file) => ({
          ...file,
          progress: 100,
        })),
      )

      // Call the callback with the uploaded files
      onUploadComplete(uploadedFiles)

      // Reset state after a short delay
      setTimeout(() => {
        setIsUploading(false)
        setFiles([])
      }, 1000)
    } catch (error) {
      console.error("Upload error:", error)
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {!propsCourseId && (
        <div className="mb-4">
          <Label htmlFor="course-select">Select Course</Label>
          <Select
            value={courseId}
            onValueChange={setCourseId}
            disabled={isLoadingCourses || isUploading || courses.length === 0}
          >
            <SelectTrigger id="course-select">
              <SelectValue placeholder={isLoadingCourses ? "Loading courses..." : "Select a course"} />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title} ({course.code})
                </SelectItem>
              ))}
              {courses.length === 0 && !isLoadingCourses && (
                <SelectItem value="none" disabled>
                  No courses available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {courses.length === 0 && !isLoadingCourses && (
            <p className="text-sm text-muted-foreground mt-1">
              You need to create a course before uploading materials.
            </p>
          )}
        </div>
      )}

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-3">
          <Cloud className="h-12 w-12 text-muted-foreground" />
          <div className="flex flex-col items-center">
            <p className="text-lg font-medium">Drag & drop files here, or click to select files</p>
            <p className="text-sm text-muted-foreground">Supports PDF, DOC, DOCX, PPT, PPTX, TXT, and JSON files</p>
          </div>
          <Button variant="secondary" className="mt-2">
            <UploadCloud className="mr-2 h-4 w-4" />
            Select Files
          </Button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Selected Files</h3>
          <div className="space-y-3">
            {files.map((file) => (
              <Card key={file.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <File className="h-8 w-8 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32">
                      <Label htmlFor={`file-type-${file.id}`} className="sr-only">
                        Material Type
                      </Label>
                      <Select
                        value={file.materialType}
                        onValueChange={(value) => updateFileType(file.id, value)}
                        disabled={isUploading}
                      >
                        <SelectTrigger id={`file-type-${file.id}`}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="syllabus">Syllabus</SelectItem>
                          <SelectItem value="slides">Slides</SelectItem>
                          <SelectItem value="notes">Lecture Notes</SelectItem>
                          <SelectItem value="transcript">Transcript</SelectItem>
                          <SelectItem value="handout">Handout</SelectItem>
                          <SelectItem value="assignment">Assignment</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFile(file.id)} disabled={isUploading}>
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove file</span>
                    </Button>
                  </div>
                </div>
                {isUploading && (
                  <div className="mt-3">
                    <Progress value={file.progress} className="h-2" />
                  </div>
                )}
              </Card>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              onClick={uploadFiles}
              disabled={
                isUploading || files.some((f) => f.materialType === "other") || !courseId || courses.length === 0
              }
            >
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUploading ? "Uploading..." : "Upload Files"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
