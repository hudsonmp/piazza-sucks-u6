"use client"

import { useState } from "react"
import {
  FileText,
  FileIcon as FilePresentation,
  FileSpreadsheet,
  File,
  Search,
  MoreVertical,
  Download,
  Trash,
  Edit,
  Eye,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/frontend/components/ui/table"
import { Input } from "@/frontend/components/ui/input"
import { Button } from "@/frontend/components/ui/button"
import { Badge } from "@/frontend/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/frontend/components/ui/dropdown-menu"
import { ScrollArea } from "@/frontend/components/ui/scroll-area"

type MaterialsListProps = {
  materials: any[]
}

export function MaterialsList({ materials }: MaterialsListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const getFileIcon = (materialType: string) => {
    switch (materialType) {
      case "syllabus":
      case "notes":
        return <FileText className="h-4 w-4" />
      case "slides":
        return <FilePresentation className="h-4 w-4" />
      case "assignment":
        return <FileSpreadsheet className="h-4 w-4" />
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
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.materialType.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No materials uploaded yet</h3>
        <p className="text-sm text-muted-foreground mt-1">Upload course materials to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search materials..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMaterials.map((material) => (
              <TableRow key={material.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(material.materialType)}
                    <span>{material.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(material.materialType)}>
                    {material.materialType.charAt(0).toUpperCase() + material.materialType.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{(material.size / 1024 / 1024).toFixed(2)} MB</TableCell>
                <TableCell>{new Date().toLocaleDateString()}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        <span>View</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        <span>Download</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}
