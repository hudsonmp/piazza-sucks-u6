"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface CourseSelectorProps {
  courses: any[]
  selectedCourse: string | null
  onCourseChange: (courseId: string) => void
}

export function CourseSelector({ courses, selectedCourse, onCourseChange }: CourseSelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedCourseData = courses.find((course) => course.id === selectedCourse)

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center">
        <GraduationCap className="mr-2 h-5 w-5 text-primary" />
        <span className="text-sm font-medium">Course:</span>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-[240px] justify-between">
            {selectedCourse && selectedCourseData
              ? `${selectedCourseData.code}: ${selectedCourseData.title}`
              : "Select course..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0">
          <Command>
            <CommandInput placeholder="Search courses..." />
            <CommandList>
              <CommandEmpty>No course found.</CommandEmpty>
              <CommandGroup>
                {courses.map((course) => (
                  <CommandItem
                    key={course.id}
                    value={course.id}
                    onSelect={() => {
                      onCourseChange(course.id)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", selectedCourse === course.id ? "opacity-100" : "opacity-0")} />
                    {course.code}: {course.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
