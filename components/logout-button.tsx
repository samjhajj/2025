"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "@/components/ui/icons"
import { useState } from "react"

export function LogoutButton() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    console.log("[v0] Logout button clicked")
    setIsLoggingOut(true)

    try {
      console.log("[v0] Calling logout API...")
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      console.log("[v0] Logout API response status:", response.status)

      if (!response.ok) {
        throw new Error("Logout failed")
      }

      console.log("[v0] Logout successful, redirecting to home page...")

      // Clear any client-side cache
      if (typeof window !== "undefined") {
        window.location.href = "/"
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      console.error("[v0] Logout error:", error)
      setIsLoggingOut(false)
      // Still try to redirect even if there's an error
      if (typeof window !== "undefined") {
        window.location.href = "/"
      }
    }
  }

  return (
    <Button variant="outline" onClick={handleLogout} className="gap-2 bg-transparent" disabled={isLoggingOut}>
      <LogOut className="h-4 w-4" />
      {isLoggingOut ? "Logging out..." : "Logout"}
    </Button>
  )
}
