"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Plane, Calendar, MapPin } from "lucide-react"
import { formatInEasternTime, formatDateRangeInEasternTime } from "@/lib/utils/date"
import type { Flight, Profile, Drone } from "@/lib/types/database"

interface FlightWithDetails extends Flight {
  profiles: Profile
  drones: Drone
}

interface Props {
  flights: FlightWithDetails[]
  department: "air_defense" | "logistics" | "intelligent_account" | "admin"
}

export function FlightReviewList({ flights, department }: Props) {
  const router = useRouter()
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleReview = async (flightId: string, status: "approved" | "rejected") => {
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/review/flight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flight_id: flightId,
          department,
          status,
          notes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit review")
      }

      setSelectedFlight(null)
      setNotes("")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getDepartmentStatusBadge = (dept: string, status: string) => {
    const deptNames: Record<string, string> = {
      air_defense: "Air Defense",
      logistics: "Logistics",
      intelligent_account: "Intelligence",
    }

    const variant = status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary"

    return (
      <Badge key={dept} variant={variant}>
        {deptNames[dept]}: {status}
      </Badge>
    )
  }

  if (flights.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Plane className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No pending flights</h3>
          <p className="text-sm text-muted-foreground">All flight requests have been reviewed</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {flights.map((flight) => (
        <Card key={flight.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {flight.flight_number}
                  <Badge variant="secondary">Pending Review</Badge>
                </CardTitle>
                <CardDescription>
                  Pilot: {flight.profiles?.full_name || "Unknown"} ({flight.profiles?.email || "N/A"})
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Purpose</p>
              <p className="text-sm text-muted-foreground">{flight.purpose}</p>
              {flight.description && (
                <>
                  <p className="text-sm font-medium mt-2 mb-1">Description</p>
                  <p className="text-sm text-muted-foreground">{flight.description}</p>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Plane className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Drone</p>
                  <p className="text-muted-foreground">
                    {flight.drones.manufacturer} {flight.drones.model}
                  </p>
                  <p className="text-xs text-muted-foreground">S/N: {flight.drones.serial_number}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Scheduled</p>
                  <p className="text-muted-foreground">
                    {formatInEasternTime(flight.scheduled_start, "MMM d, yyyy", false)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateRangeInEasternTime(flight.scheduled_start, flight.scheduled_end)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground">{flight.departure_location}</p>
                  <p className="text-xs text-muted-foreground">
                    {flight.departure_lat != null && flight.departure_lng != null
                      ? `${flight.departure_lat.toFixed(4)}, ${flight.departure_lng.toFixed(4)}`
                      : "Coordinates not available"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Max Altitude</p>
                <p className="font-medium">{flight.max_altitude_m} meters</p>
              </div>
              <div>
                <p className="text-muted-foreground">{flight.radius_m ? "Operation Radius" : "Duration"}</p>
                <p className="font-medium">
                  {flight.radius_m ? `${flight.radius_m} meters` : `${flight.estimated_duration_minutes} minutes`}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Other Department Reviews</p>
              <div className="flex gap-2 flex-wrap">
                {department !== "air_defense" &&
                  (flight as any).air_defense_status &&
                  getDepartmentStatusBadge("air_defense", (flight as any).air_defense_status)}
                {department !== "logistics" &&
                  (flight as any).logistics_status &&
                  getDepartmentStatusBadge("logistics", (flight as any).logistics_status)}
                {department !== "intelligent_account" &&
                  (flight as any).intelligent_account_status &&
                  getDepartmentStatusBadge("intelligent_account", (flight as any).intelligent_account_status)}
              </div>
            </div>

            {selectedFlight === flight.id ? (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor={`notes-${flight.id}`}>Review Notes</Label>
                  <Textarea
                    id={`notes-${flight.id}`}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes or comments about this review..."
                    rows={3}
                    disabled={loading}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleReview(flight.id, "approved")} disabled={loading} className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReview(flight.id, "rejected")}
                    disabled={loading}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedFlight(null)
                      setNotes("")
                    }}
                    disabled={loading}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setSelectedFlight(flight.id)} className="w-full">
                Review Flight
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
