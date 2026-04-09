"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Loader2 } from "lucide-react"
import { updateJobStatus } from "@/app/actions/jobActions"

// These MUST perfectly match your Mongoose Schema Enums!
const STATUS_OPTIONS = ["Processing", "Pending", "Completed", "Cancel"]

export default function StatusDropdown({ jobId, currentStatus }: { jobId: string, currentStatus: string }) {
  const [isUpdating, setIsUpdating] = React.useState(false)

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return; // Don't update if it's the same
    
    setIsUpdating(true)
    await updateJobStatus(jobId, newStatus)
    setIsUpdating(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="font-semibold" disabled={isUpdating}>
          {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Update Status"}
          {!isUpdating && <ChevronDown className="h-4 w-4 ml-2 opacity-50" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {STATUS_OPTIONS.map((status) => (
          <DropdownMenuItem 
            key={status} 
            onClick={() => handleStatusChange(status)}
            className={currentStatus === status ? "font-bold bg-muted/50" : ""}
          >
            Mark as {status}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}