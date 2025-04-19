"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUploader } from "@/components/file-uploader"
import { CourseForm } from "@/components/course-form"
import { MaterialsList } from "@/components/materials-list"
import { PlusCircle } from "lucide-react"
import { SupabaseStatus } from "@/components/supabase-status"

export function CourseUploadDashboard() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("upload")
  const [materials, setMaterials] = useState<any[]>([])

  const handleMaterialsUpdate = (newMaterials: any[]) => {
    setMaterials([...materials, ...newMaterials])
    toast({
      title: "Materials uploaded",
      description: `${newMaterials.length} file(s) have been uploaded successfully.`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Course Materials</h1>
        <p className="text-muted-foreground">Upload and manage your course materials for AI-enhanced learning.</p>
      </div>

      <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upload">Upload Materials</TabsTrigger>
          <TabsTrigger value="manage">Manage Materials</TabsTrigger>
          <TabsTrigger value="course">Course Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Course Materials</CardTitle>
              <CardDescription>
                Upload your syllabus, slideshows, lecture notes, transcripts, and assignments. These will be processed
                for AI-enhanced semantic search.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader onUploadComplete={handleMaterialsUpdate} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Materials</CardTitle>
              <CardDescription>View, organize, and manage your uploaded course materials.</CardDescription>
            </CardHeader>
            <CardContent>
              <MaterialsList materials={materials} />
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => setActiveTab("upload")}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Upload More Materials
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="course" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Settings</CardTitle>
              <CardDescription>Configure your course details and settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <CourseForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supabase Connection</CardTitle>
              <CardDescription>Check the status of your Supabase connection.</CardDescription>
            </CardHeader>
            <CardContent>
              <SupabaseStatus />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
