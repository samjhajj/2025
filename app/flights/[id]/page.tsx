"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plane, Calendar, MapPin, Clock, Loader2 } from "@/components/ui/icons"
import Link from "next/link"
import { FlightTracker } from "@/components/flights/flight-tracker"
import { formatInEasternTime } from "@/lib/utils/date"

interface FlightDetail {
  id: string
  purpose: string
  status: string
  pilot_id: string
  location: string
  latitude: number
  longitude: number
  max_altitude_m: number
  start_time: string
  end_time: string
  air_defense_status: string
  air_defense_notes: string | null
  logistics_status: string
  logistics_notes: string | null
  intelligent_account_status: string
  intelligent_account_notes: string | null
  reviewed_at: string | null
  profiles: {
    full_name: string
    email: string
    phone: string | null
  }
  drones: {
    manufacturer: string
    model: string
    serial_number: string
  }
}

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export default function FlightDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [flight, setFlight] = useState<FlightDetail | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFlight = async () => {
      try {
        const response = await fetch(`/api/flights/${params.id}`)

        if (response.status === 401) {
          router.push("/login")
          return
        }

        if (response.status === 403) {
          router.push("/dashboard")
          return
        }

        if (!response.ok) {
          router.push("/flights")
          return
        }

        const data = await response.json()
        setFlight(data.flight)
        setIsOwner(data.isOwner)
      } catch (error) {
        console.error("[v0] Error fetching flight:", error)
        router.push("/flights")
      } finally {
        setLoading(false)
      }
    }

    fetchFlight()
  }, [params.id, router])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      submitted: "outline",
      under_review: "outline",
      approved: "default",
      rejected: "destructive",
      active: "default",
      completed: "secondary",
      cancelled: "destructive",
    }
    return <Badge variant={variants[status] || "secondary"}>{status.replace("_", " ")}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!flight) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Flight Details</h1>
            <p className="text-muted-foreground">{flight.purpose}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/flights">Back to Flights</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Flight Information</CardTitle>
                    <CardDescription>Details about this flight request</CardDescription>
                  </div>
                  {getStatusBadge(flight.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Purpose</p>
                  <p className="text-sm text-muted-foreground">{flight.purpose}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-start gap-2">
                    <Plane className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Drone</p>
                      <p className="text-sm text-muted-foreground">
                        {flight.drones.manufacturer} {flight.drones.model}
                      </p>
                      <p className="text-xs text-muted-foreground">S/N: {flight.drones.serial_number}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Max Altitude</p>
                      <p className="text-sm text-muted-foreground">{flight.max_altitude_m} meters</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Scheduled Start</p>
                      <p className="text-sm text-muted-foreground">
                        {formatInEasternTime(flight.start_time, "MMM d, yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">{formatInEasternTime(flight.start_time, "HH:mm")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Scheduled End</p>
                      <p className="text-sm text-muted-foreground">
                        {formatInEasternTime(flight.end_time, "MMM d, yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">{formatInEasternTime(flight.end_time, "HH:mm")}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm font-medium">Location</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{flight.location}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {flight.latitude.toFixed(6)}, {flight.longitude.toFixed(6)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {isOwner && (flight.status === "approved" || flight.status === "active") && (
              <Card>
                <CardHeader>
                  <CardTitle>Flight Tracker</CardTitle>
                  <CardDescription>
                    {flight.status === "active"
                      ? "Flight in progress - End when complete"
                      : "Start your flight when ready"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FlightTracker flightId={flight.id} initialStatus={flight.status} />
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Approval Status</CardTitle>
                <CardDescription>Review status from all departments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">Air Defense</p>
                    <Badge variant={flight.air_defense_status === "approved" ? "default" : "secondary"}>
                      {flight.air_defense_status}
                    </Badge>
                  </div>
                  {flight.air_defense_notes && (
                    <p className="text-xs text-muted-foreground">{flight.air_defense_notes}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">Logistics</p>
                    <Badge variant={flight.logistics_status === "approved" ? "default" : "secondary"}>
                      {flight.logistics_status}
                    </Badge>
                  </div>
                  {flight.logistics_notes && <p className="text-xs text-muted-foreground">{flight.logistics_notes}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">Intelligence</p>
                    <Badge variant={flight.intelligent_account_status === "approved" ? "default" : "secondary"}>
                      {flight.intelligent_account_status}
                    </Badge>
                  </div>
                  {flight.intelligent_account_notes && (
                    <p className="text-xs text-muted-foreground">{flight.intelligent_account_notes}</p>
                  )}
                </div>

                {flight.reviewed_at && (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Reviewed: {formatInEasternTime(flight.reviewed_at, "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pilot Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{flight.profiles.full_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{flight.profiles.email}</p>
                </div>
                {flight.profiles.phone && (
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{flight.profiles.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
