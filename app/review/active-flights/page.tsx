"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Package, Eye, ArrowLeft, Plane } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ActiveFlightsMap } from "@/components/review/active-flights-map"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatInEasternTime } from "@/lib/utils/date"

type Flight = {
  id: string
  flight_number: string
  status: string
  departure_location: string
  destination_location: string
  actual_start: string | null
  actual_end: string | null
  created_at: string
  profiles: {
    full_name: string
  } | null
  drones: {
    manufacturer: string
    model: string
  } | null
}

export default function ActiveFlightsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeFlights, setActiveFlights] = useState<Flight[]>([])
  const [previousFlights, setPreviousFlights] = useState<Flight[]>([])
  const [department, setDepartment] = useState<string>("air_defense")

  useEffect(() => {
    async function fetchFlights() {
      try {
        console.log("[v0] Fetching active flights from API...")
        const response = await fetch("/api/review/active-flights")

        if (response.status === 401) {
          router.push("/login")
          return
        }

        if (response.status === 403) {
          router.push("/dashboard")
          return
        }

        if (!response.ok) {
          throw new Error("Failed to fetch flights")
        }

        const data = await response.json()
        console.log("[v0] Active flights received:", data.activeFlights?.length || 0)
        console.log("[v0] Active flights data:", data.activeFlights)
        console.log("[v0] Previous flights received:", data.previousFlights?.length || 0)

        setActiveFlights(data.activeFlights || [])
        setPreviousFlights(data.previousFlights || [])
        setDepartment(data.department || "air_defense")
      } catch (error) {
        console.error("[v0] Error fetching flights:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFlights()
  }, [router])

  const getDepartmentIcon = () => {
    switch (department) {
      case "air_defense":
        return <Shield className="h-6 w-6" />
      case "logistics":
        return <Package className="h-6 w-6" />
      case "intelligence":
        return <Eye className="h-6 w-6" />
      default:
        return <Shield className="h-6 w-6" />
    }
  }

  const getDepartmentName = () => {
    switch (department) {
      case "air_defense":
        return "Air Defense"
      case "logistics":
        return "Logistics"
      case "intelligence":
        return "Intelligence"
      default:
        return "Admin"
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "completed":
        return "secondary"
      case "approved":
        return "outline"
      case "rejected":
        return "destructive"
      default:
        return "secondary"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading flights...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link href="/review">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              {getDepartmentIcon()}
            </div>
            <div>
              <h1 className="text-3xl font-bold">Flight Tracking Map</h1>
              <p className="text-muted-foreground">Monitor active and previous drone flights</p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">
              Active Flights
              {activeFlights.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFlights.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="previous">
              Previous Flights
              {previousFlights.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {previousFlights.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Flight Tracking</CardTitle>
                <CardDescription>Monitor all active drone flights in real-time on the map below</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ActiveFlightsMap flights={activeFlights} />
              </CardContent>
            </Card>

            {activeFlights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Active Flights List</CardTitle>
                  <CardDescription>Details of currently active flights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeFlights.map((flight) => (
                      <div key={flight.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{flight.flight_number}</p>
                          <p className="text-sm text-muted-foreground">
                            Pilot: {flight.profiles?.full_name || "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Drone: {flight.drones?.manufacturer} {flight.drones?.model}
                          </p>
                          {flight.actual_start && (
                            <p className="text-xs text-muted-foreground">
                              Started: {formatInEasternTime(flight.actual_start)}
                            </p>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant="default">Active</Badge>
                          <p className="text-sm text-muted-foreground">{flight.departure_location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeFlights.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Plane className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No active flights</h3>
                  <p className="text-sm text-muted-foreground">There are currently no flights in progress</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="previous" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Previous Flights Map</CardTitle>
                <CardDescription>View completed and historical flight paths</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ActiveFlightsMap flights={previousFlights} />
              </CardContent>
            </Card>

            {previousFlights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Previous Flights List</CardTitle>
                  <CardDescription>History of completed, approved, and rejected flights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {previousFlights.map((flight) => (
                      <div key={flight.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{flight.flight_number}</p>
                          <p className="text-sm text-muted-foreground">
                            Pilot: {flight.profiles?.full_name || "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Drone: {flight.drones?.manufacturer} {flight.drones?.model}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Submitted: {formatInEasternTime(flight.created_at)}
                          </p>
                          {flight.actual_start && (
                            <p className="text-xs text-muted-foreground">
                              Started: {formatInEasternTime(flight.actual_start)}
                            </p>
                          )}
                          {flight.actual_end && (
                            <p className="text-xs text-muted-foreground">
                              Ended: {formatInEasternTime(flight.actual_end)}
                            </p>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant={getStatusVariant(flight.status)}>
                            {flight.status.replace("_", " ").toUpperCase()}
                          </Badge>
                          <p className="text-sm text-muted-foreground">{flight.departure_location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {previousFlights.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Plane className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No previous flights</h3>
                  <p className="text-sm text-muted-foreground">No flight history available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
