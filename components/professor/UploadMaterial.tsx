"use client";

import { useState } from "react";
import { processCourseMaterial } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface UploadMaterialProps {
  courseId: string;
}

export default function UploadMaterial({ courseId }: UploadMaterialProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [materialType, setMaterialType] = useState("syllabus");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!title) {
      toast({
        title: "Error",
        description: "Please enter a title for this material",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const result = await processCourseMaterial(
        file,
        materialType,
        courseId,
        title,
        description
      );

      toast({
        title: "Success",
        description: `Material uploaded and processed ${result.chunks_processed} chunks`,
      });

      // Reset form
      setFile(null);
      setTitle("");
      setDescription("");
      setMaterialType("syllabus");
      
      // Reset file input
      const fileInput = document.getElementById("material-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Error uploading material:", error);
      toast({
        title: "Error",
        description: "Failed to process material. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Course Material</CardTitle>
        <CardDescription>
          Upload syllabi, lecture notes, transcripts, or slideshows to make them searchable
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material-type">Material Type</Label>
            <Select 
              value={materialType} 
              onValueChange={setMaterialType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select material type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="syllabus">Syllabus</SelectItem>
                <SelectItem value="transcript">Transcript</SelectItem>
                <SelectItem value="lecture_notes">Lecture Notes</SelectItem>
                <SelectItem value="slideshow">Slideshow</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter a title for this material"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter a description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="material-file">File</Label>
            <Input
              id="material-file"
              type="file"
              onChange={handleFileChange}
              required
            />
            <p className="text-sm text-muted-foreground">
              Supported formats: PDF, DOCX, TXT (max 10MB)
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isUploading}
          >
            {isUploading ? "Processing..." : "Upload & Process"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 