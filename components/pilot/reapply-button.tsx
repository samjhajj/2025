"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { RefreshCw } from "@/components/ui/icons"
import { useToast } from "@/hooks/use-toast"

export function ReapplyButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleReapply = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/pilot/reapply", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to re-apply")
      }

      toast({
        title: "Application Reset",
        description:
          "Your application has been reset to pending status. You can now update your information and resubmit.",
      })

      router.refresh()
    } catch (error) {
      console.error("[v0] Error re-applying:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to re-apply. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <RefreshCw className="h-4 w-4" />
          Re-apply
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Re-apply for Approval?</AlertDialogTitle>
          <AlertDialogDescription>
            This will reset your application status to pending and clear all rejection notes. You can then update your
            information and resubmit for review. Are you sure you want to continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReapply} disabled={isLoading}>
            {isLoading ? "Processing..." : "Yes, Re-apply"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
