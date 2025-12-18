"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plane, MapPin, Home } from "@/components/ui/icons"
import Link from "next/link"
import { formatInEasternTime } from "@/lib/utils/date"

function Plus({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function Calendar({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  )
}

interface Drone {
  id: string
  manufacturer: string
  model: string
}

interface Flight {
  id: string
  flight_number: string
  purpose: string
  status: string
  scheduled_start: string
  departure_location: string
  overall_status: string
  air_defense_status: string
  logistics_status: string
  intelligence_status: string
  drones: Drone | null
}

export default function FlightsPage() {
  const router = useRouter()
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/flights")

        if (response.status === 401) {
          router.push("/login")
          return
        }

        if (!response.ok) {
          throw new Error("Failed to fetch flights")
        }

        const data = await response.json()
        setFlights(data)
      } catch (err) {
        console.error("[v0] Error fetching flights:", err)
        setError(err instanceof Error ? err.message : "Failed to load flights")
      } finally {
        setLoading(false)
      }
    }

    fetchFlights()
  }, [router])

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading flights...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Flight Requests</h1>
              <p className="text-muted-foreground">Manage your flight requests and approvals</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Return to Dashboard
                </Link>
              </Button>
              <Button asChild>
                <Link href="/flights/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Flight Request
                </Link>
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Flight Requests</h1>
            <p className="text-muted-foreground">Manage your flight requests and approvals</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Link>
            </Button>
            <Button asChild>
              <Link href="/flights/new">
                <Plus className="h-4 w-4 mr-2" />
                New Flight Request
              </Link>
            </Button>
          </div>
        </div>

        {!flights || flights.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Plane className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No flight requests</h3>
              <p className="text-sm text-muted-foreground mb-4">Submit your first flight request to get started</p>
              <Button asChild>
                <Link href="/flights/new">New Flight Request</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {flights.map((flight) => (
              <Card key={flight.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {flight.flight_number}
                        {getStatusBadge(flight.status)}
                      </CardTitle>
                      <CardDescription>{flight.purpose}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/flights/${flight.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-2">
                      <Plane className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Drone</p>
                        <p className="text-sm text-muted-foreground">
                          {flight.drones?.manufacturer} {flight.drones?.model}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Scheduled</p>
                        <p className="text-sm text-muted-foreground">
                          {formatInEasternTime(flight.scheduled_start, "MMM d, yyyy HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">{flight.departure_location}</p>
                      </div>
                    </div>
                  </div>

                  {flight.overall_status !== "pending" && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Approval Status</p>
                      <div className="flex gap-2">
                        <Badge variant={flight.air_defense_status === "approved" ? "default" : "secondary"}>
                          Air Defense: {flight.air_defense_status}
                        </Badge>
                        <Badge variant={flight.logistics_status === "approved" ? "default" : "secondary"}>
                          Logistics: {flight.logistics_status}
                        </Badge>
                        <Badge variant={flight.intelligence_status === "approved" ? "default" : "secondary"}>
                          Intelligence: {flight.intelligence_status}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
