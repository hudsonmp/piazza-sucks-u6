"use client"

import { useState, useEffect } from "react"
import { FileText, FileIcon, File, Download, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabaseAuth } from "@/lib/supabase-auth"

interface MaterialsListProps {
  courseId: string
}

export function MaterialsList({ courseId }: MaterialsListProps) {
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function fetchMaterials() {
      setLoading(true)
      try {
        const { data, error } = await supabaseAuth
          .from("materials")
          .select("*")
          .eq("course_id", courseId)
          .order("created_at", { ascending: false })

        if (error) throw error
        setMaterials(data || [])
      } catch (error) {
        console.error("Error fetching materials:", error)
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      fetchMaterials()
    }
  }, [courseId])

  const getFileIcon = (materialType: string) => {
    switch (materialType) {
      case "syllabus":
      case "notes":
        return <FileText className="h-4 w-4" />
      case "slides":
        return <FileIcon className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const getBadgeVariant = (materialType: string) => {
    switch (materialType) {
      case "syllabus":
        return "default"
      case "slides":
        return "secondary"
      case "notes":
        return "outline"
      case "transcript":
        return "destructive"
      case "assignment":
        return "warning"
      default:
        return "default"
    }
  }

  const filteredMaterials = materials.filter(
    (material) =>
      material.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.material_type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDownload = async (material: any) => {
    try {
      const { data, error } = await supabaseAuth.storage
        .from("course-materials")
        .createSignedUrl(material.file_path, 60)

      if (error) throw error

      // Open the signed URL in a new tab
      window.open(data.signedUrl, "_blank")
    } catch (error) {
      console.error("Error downloading file:", error)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Course Materials</CardTitle>
        <CardDescription>Access your course resources</CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search materials..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading materials...</p>
            </div>
          </div>
        ) : filteredMaterials.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {filteredMaterials.map((material) => (
                <div key={material.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(material.material_type)}
                    <div>
                      <div className="font-medium">{material.file_name}</div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getBadgeVariant(material.material_type)}>
                          {material.material_type.charAt(0).toUpperCase() + material.material_type.slice(1)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(material.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDownload(material)}>
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download</span>
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No materials found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm ? "Try a different search term" : "Your professor hasn't uploaded any materials yet"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
