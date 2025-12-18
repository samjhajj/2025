"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, Square } from "lucide-react"

interface Props {
  flightId: string
  initialStatus: string
}

export function FlightTracker({ flightId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleStartFlight = async () => {
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch(`/api/flights/${flightId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to start flight")
      }

      setStatus("active")
      setSuccess("Flight started successfully!")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start flight")
    } finally {
      setLoading(false)
    }
  }

  const handleEndFlight = async () => {
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch(`/api/flights/${flightId}/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to end flight")
      }

      setStatus("completed")
      setSuccess("Flight ended successfully!")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end flight")
    } finally {
      setLoading(false)
    }
  }

  const isActive = status === "active"

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${isActive ? "bg-green-500 animate-pulse" : "bg-slate-300"}`} />
          <span className="font-medium">{isActive ? "Flight In Progress" : "Ready to Start"}</span>
        </div>
        {!isActive ? (
          <Button onClick={handleStartFlight} disabled={loading}>
            <Play className="h-4 w-4 mr-2" />
            {loading ? "Starting..." : "Start Flight"}
          </Button>
        ) : (
          <Button onClick={handleEndFlight} disabled={loading} variant="destructive">
            <Square className="h-4 w-4 mr-2" />
            {loading ? "Ending..." : "End Flight"}
          </Button>
        )}
      </div>
    </div>
  )
}
