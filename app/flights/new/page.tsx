"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import type { Drone } from "@/lib/types/database"

export default function NewFlightPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [drones, setDrones] = useState<Drone[]>([])
  const [fetchingDrones, setFetchingDrones] = useState(true)
  const [fetchingLocation, setFetchingLocation] = useState(false)

  const [formData, setFormData] = useState({
    droneId: "",
    purpose: "",
    description: "",
    departureLocation: "",
    departureLat: "",
    departureLng: "",
    scheduledStart: "",
    scheduledEnd: "",
    maxAltitudeM: "",
    estimatedDurationMinutes: "",
    radiusM: "100",
  })

  useEffect(() => {
    console.log("[v0] NewFlightPage mounted")
  }, [])

  useEffect(() => {
    const fetchDrones = async () => {
      try {
        console.log("[v0] Fetching drones...")
        setFetchingDrones(true)
        const response = await fetch("/api/drones")
        console.log("[v0] Drones API response status:", response.status)
        if (response.ok) {
          const data = await response.json()
          console.log("[v0] Drones fetched:", data.length)
          setDrones(data)
        } else {
          console.error("[v0] Failed to fetch drones:", response.status)
        }
      } catch (err) {
        console.error("[v0] Error fetching drones:", err)
      } finally {
        setFetchingDrones(false)
      }
    }
    fetchDrones()
  }, [])

  const handleUseMyLocation = () => {
    console.log("[v0] Use My Location clicked")

    if (!navigator.geolocation) {
      console.error("[v0] Geolocation not supported by browser")
      setError("Geolocation is not supported by your browser")
      return
    }

    console.log("[v0] Geolocation API available, requesting position...")
    setFetchingLocation(true)
    setError("")

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("[v0] Geolocation SUCCESS")
        console.log("[v0] Location obtained:", position.coords.latitude, position.coords.longitude)
        setFormData({
          ...formData,
          departureLat: position.coords.latitude.toString(),
          departureLng: position.coords.longitude.toString(),
        })
        setFetchingLocation(false)
      },
      (error) => {
        console.error("[v0] Geolocation ERROR:", error.code, error.message)
        console.error("[v0] Error details:", {
          code: error.code,
          message: error.message,
          PERMISSION_DENIED: error.code === 1,
          POSITION_UNAVAILABLE: error.code === 2,
          TIMEOUT: error.code === 3,
        })
        setError(`Unable to get location: ${error.message}`)
        setFetchingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
    console.log("[v0] Geolocation request initiated, waiting for response...")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Form submit triggered")
    console.log("[v0] Form data:", formData)

    setError("")
    setLoading(true)

    try {
      const scheduledStartDate = new Date(formData.scheduledStart)
      const scheduledEndDate = new Date(formData.scheduledEnd)

      const payload = {
        drone_id: formData.droneId,
        purpose: formData.purpose,
        description: formData.description || null,
        departure_location: formData.departureLocation,
        departure_lat: Number.parseFloat(formData.departureLat),
        departure_lng: Number.parseFloat(formData.departureLng),
        destination_location: null,
        destination_lat: null,
        destination_lng: null,
        scheduled_start: scheduledStartDate.toISOString(),
        scheduled_end: scheduledEndDate.toISOString(),
        max_altitude_m: Number.parseInt(formData.maxAltitudeM),
        estimated_duration_minutes: Number.parseInt(formData.estimatedDurationMinutes),
        radius_m: Number.parseInt(formData.radiusM),
      }

      console.log("[v0] Submitting flight request:", payload)

      const response = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log("[v0] Flight API response status:", response.status)

      if (!response.ok) {
        const data = await response.json()
        console.error("[v0] Flight submission failed:", data)
        throw new Error(data.error || "Failed to submit flight request")
      }

      const result = await response.json()
      console.log("[v0] Flight submitted successfully:", result)
      console.log("[v0] Navigating to /flights")

      router.push("/flights")
      router.refresh()
    } catch (err) {
      console.error("[v0] Submit error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const isSubmitDisabled = loading || drones.length === 0 || !formData.departureLat || !formData.departureLng
  console.log("[v0] Submit button disabled:", isSubmitDisabled, {
    loading,
    hasDrones: drones.length > 0,
    hasCoordinates: !!(formData.departureLat && formData.departureLng),
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" asChild>
            <Link href="/flights">← Back to Flights</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>New Flight Request</CardTitle>
            <CardDescription>Submit a new flight request for approval</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {error}
                    {error.includes("profile must be approved") && (
                      <>
                        {" "}
                        <Link href="/dashboard" className="font-semibold underline">
                          Return to dashboard
                        </Link>{" "}
                        to check your profile status.
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {!fetchingDrones && drones.length === 0 && (
                <Alert>
                  <AlertDescription>
                    You need to register a drone before submitting a flight request.{" "}
                    <Link href="/drones/new" className="font-semibold text-primary hover:underline">
                      Register a drone now →
                    </Link>
                  </AlertDescription>
                </Alert>
              )}

              {fetchingDrones ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading drones...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="droneId">Select Drone</Label>
                    <Select
                      value={formData.droneId}
                      onValueChange={(value) => setFormData({ ...formData, droneId: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a drone" />
                      </SelectTrigger>
                      <SelectContent>
                        {drones.map((drone) => (
                          <SelectItem key={drone.id} value={drone.id}>
                            {drone.manufacturer} {drone.model} (S/N: {drone.serial_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {drones.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No drones registered.{" "}
                        <Link href="/drones/new" className="text-primary hover:underline">
                          Register a drone first
                        </Link>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">Flight Purpose</Label>
                    <Input
                      id="purpose"
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      required
                      disabled={loading}
                      placeholder="e.g., Aerial photography, Survey, Inspection"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={loading}
                      placeholder="Additional details about the flight"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Flight Location</h3>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="departureLocation">Location Name</Label>
                      <Input
                        id="departureLocation"
                        value={formData.departureLocation}
                        onChange={(e) => setFormData({ ...formData, departureLocation: e.target.value })}
                        required
                        disabled={loading}
                        placeholder="e.g., Central Park, New York"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Coordinates</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={handleUseMyLocation}
                        disabled={loading || fetchingLocation}
                      >
                        {fetchingLocation ? "Getting Location..." : "📍 Use My Current Location"}
                      </Button>
                      {formData.departureLat && formData.departureLng && (
                        <p className="text-sm text-muted-foreground">
                          Location: {Number.parseFloat(formData.departureLat).toFixed(6)},{" "}
                          {Number.parseFloat(formData.departureLng).toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="radiusM">Flight Radius (meters)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="radiusM"
                        type="number"
                        min="1"
                        max="1000"
                        value={formData.radiusM}
                        onChange={(e) => setFormData({ ...formData, radiusM: e.target.value })}
                        required
                        disabled={loading}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">{formData.radiusM} m</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Specify the radius of your flight operation area (1-1000 meters)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduledStart">Scheduled Start (EST)</Label>
                      <Input
                        id="scheduledStart"
                        type="datetime-local"
                        value={formData.scheduledStart}
                        onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                        required
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">Enter time in Eastern Standard Time</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scheduledEnd">Scheduled End (EST)</Label>
                      <Input
                        id="scheduledEnd"
                        type="datetime-local"
                        value={formData.scheduledEnd}
                        onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
                        required
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">Enter time in Eastern Standard Time</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxAltitudeM">Maximum Altitude (meters)</Label>
                      <Input
                        id="maxAltitudeM"
                        type="number"
                        value={formData.maxAltitudeM}
                        onChange={(e) => setFormData({ ...formData, maxAltitudeM: e.target.value })}
                        required
                        disabled={loading}
                        placeholder="120"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estimatedDurationMinutes">Estimated Duration (minutes)</Label>
                      <Input
                        id="estimatedDurationMinutes"
                        type="number"
                        value={formData.estimatedDurationMinutes}
                        onChange={(e) => setFormData({ ...formData, estimatedDurationMinutes: e.target.value })}
                        required
                        disabled={loading}
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
                    {loading ? "Submitting..." : "Submit Flight Request"}
                  </Button>

                  {isSubmitDisabled && !loading && (
                    <p className="text-sm text-center text-muted-foreground">
                      {drones.length === 0 && "Please register a drone first"}
                      {drones.length > 0 &&
                        (!formData.departureLat || !formData.departureLng) &&
                        "Please set your location coordinates"}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}
