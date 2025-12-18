"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle, Plane } from "@/components/ui/icons"
import { formatDistanceToNow } from "date-fns"

interface Drone {
  id: string
  manufacturer: string
  model: string
  serial_number: string
  registration_number: string | null
  weight_kg: number
  max_altitude_m: number
  max_speed_kmh: number
  has_camera: boolean
  camera_resolution: string | null
  has_thermal_imaging: boolean
  is_registered: boolean
  created_at: string
  pilot_id: string
  profiles?: {
    full_name: string
    email: string
    phone: string
  }
}

interface DroneReviewListProps {
  drones: Drone[]
}

export function DroneReviewList({ drones: initialDrones }: DroneReviewListProps) {
  const [drones, setDrones] = useState(initialDrones)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const handleReview = async (droneId: string, approved: boolean) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/review/drones/${droneId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved, notes }),
      })

      if (!response.ok) {
        throw new Error("Failed to review drone")
      }

      // Remove the reviewed drone from the list
      setDrones(drones.filter((d) => d.id !== droneId))
      setReviewingId(null)
      setNotes("")
    } catch (error) {
      console.error("Error reviewing drone:", error)
      alert("Failed to review drone. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (drones.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Plane className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No pending drones to review</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {drones.map((drone) => (
        <Card key={drone.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5" />
                  {drone.manufacturer} {drone.model}
                </CardTitle>
                <CardDescription>
                  Submitted {formatDistanceToNow(new Date(drone.created_at), { addSuffix: true })}
                </CardDescription>
              </div>
              <Badge variant={drone.is_registered ? "default" : "secondary"}>
                {drone.is_registered ? "Approved" : "Pending"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pilot</p>
                <p className="text-sm">{drone.profiles?.full_name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">{drone.profiles?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Serial Number</p>
                <p className="text-sm font-mono">{drone.serial_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weight</p>
                <p className="text-sm">{drone.weight_kg} kg</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Max Altitude</p>
                <p className="text-sm">{drone.max_altitude_m} m</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Max Speed</p>
                <p className="text-sm">{drone.max_speed_kmh} km/h</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Camera</p>
                <p className="text-sm">
                  {drone.has_camera ? (
                    <>
                      Yes {drone.camera_resolution && `(${drone.camera_resolution})`}
                      {drone.has_thermal_imaging && " + Thermal"}
                    </>
                  ) : (
                    "No"
                  )}
                </p>
              </div>
            </div>

            {reviewingId === drone.id ? (
              <div className="space-y-3 pt-4 border-t">
                <Textarea
                  placeholder="Add review notes (optional)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleReview(drone.id, true)}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReview(drone.id, false)}
                    disabled={loading}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button onClick={() => setReviewingId(null)} variant="outline" disabled={loading}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setReviewingId(drone.id)} className="w-full">
                Review Drone
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
