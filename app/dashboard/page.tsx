"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plane, FileText, CreditCard, AlertCircle, PlaneTakeoff } from "@/components/ui/icons"
import Link from "next/link"
import { CompleteProfileForm } from "@/components/complete-profile-form"
import { LogoutButton } from "@/components/logout-button"
import { DronesTable } from "@/components/pilot/drones-table"
import { ReapplyWithDocuments } from "@/components/pilot/reapply-with-documents"

type DashboardData = {
  user: any
  pilotProfile: any
  flights: any[]
  drones: any[]
  notifications: any[]
  redirect?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) {
      console.log("[v0] Already fetched, skipping...")
      return
    }
    fetchedRef.current = true

    async function fetchDashboard() {
      try {
        console.log("[v0] Fetching dashboard data...")
        const response = await fetch("/api/dashboard")
        console.log("[v0] Dashboard response status:", response.status)

        if (response.status === 401) {
          console.log("[v0] Unauthorized, redirecting to login")
          router.push("/login")
          return
        }

        if (!response.ok) {
          console.log("[v0] Response not ok:", response.status, response.statusText)
          throw new Error("Failed to fetch dashboard data")
        }

        console.log("[v0] Parsing response JSON...")
        const dashboardData = await response.json()
        console.log("[v0] JSON parsed successfully")
        console.log("[v0] Dashboard data received:", {
          hasUser: !!dashboardData.user,
          hasProfile: !!dashboardData.pilotProfile,
          flightsCount: dashboardData.flights?.length,
          dronesCount: dashboardData.drones?.length,
          hasRedirect: !!dashboardData.redirect,
        })

        if (dashboardData.redirect) {
          console.log("[v0] Redirecting to:", dashboardData.redirect)
          setRedirecting(true)
          router.push(dashboardData.redirect)
          return
        }

        console.log("[v0] Setting dashboard data...")
        setData(dashboardData)
        setError(null)
        console.log("[v0] Dashboard data set successfully")
      } catch (err) {
        console.error("[v0] Dashboard fetch error:", err)
        console.error("[v0] Error type:", err instanceof Error ? err.constructor.name : typeof err)
        console.error("[v0] Error message:", err instanceof Error ? err.message : String(err))
        console.error("[v0] Error stack:", err instanceof Error ? err.stack : "No stack trace")
        setError(err instanceof Error ? err.message : "Failed to load dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [router])

  console.log(
    "[v0] Dashboard render - loading:",
    loading,
    "error:",
    error,
    "hasData:",
    !!data,
    "redirecting:",
    redirecting,
  )

  if (redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    console.log("[v0] Showing error state - error:", error, "data:", data)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error || "Failed to load dashboard"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
            <Button onClick={() => router.push("/login")} variant="outline" className="w-full">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { user, pilotProfile, flights, drones, notifications } = data

  if (!pilotProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome to Your Dashboard</h1>
              <p className="text-muted-foreground">Complete your profile to get started</p>
            </div>
            <div className="flex items-center gap-3">
              <LogoutButton />
            </div>
          </div>
          <div className="max-w-3xl mx-auto">
            <CompleteProfileForm />
          </div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string | null | undefined) => {
    const safeStatus = status || "pending"
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      under_review: "outline",
    }
    return <Badge variant={variants[safeStatus] || "secondary"}>{safeStatus.replace("_", " ")}</Badge>
  }

  const handleViewFlights = () => {
    console.log("[v0] handleViewFlights called - navigating to /flights")
    router.push("/flights")
  }

  const handleCreateFlight = () => {
    console.log("[v0] handleCreateFlight called - navigating to /flights/new")
    router.push("/flights/new")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pilot Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {user.user_metadata?.full_name || user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline">
              <Link href="/drones/new">
                <PlaneTakeoff className="mr-2 h-4 w-4" />
                Add Drone
              </Link>
            </Button>
            <LogoutButton />
          </div>
        </div>

        {pilotProfile.overall_status === "rejected" && (
          <ReapplyWithDocuments
            pilotProfile={pilotProfile}
            onSuccess={() => {
              alert("Your application has been reset successfully. It will be reviewed again by all departments.")
              window.location.reload()
            }}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                View All Flights
              </CardTitle>
              <CardDescription>View and manage your flight requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg" onClick={handleViewFlights} data-action="view-flights">
                Go to Flights
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlaneTakeoff className="h-5 w-5" />
                Request New Flight
              </CardTitle>
              <CardDescription>Submit a new flight request for approval</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg" onClick={handleCreateFlight} data-action="create-flight">
                Create Flight Request
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Status</CardTitle>
            <CardDescription>Your approval status across all departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Air Defense</p>
                {getStatusBadge(pilotProfile.air_defense_status)}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Logistics</p>
                {getStatusBadge(pilotProfile.logistics_status)}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Intelligence</p>
                {getStatusBadge(pilotProfile.intelligence_status)}
              </div>
            </div>
            {pilotProfile.overall_status === "pending" && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Your profile is under review by the departments</span>
              </div>
            )}
            {pilotProfile.overall_status === "rejected" && (
              <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>Your profile has been rejected. Please review the feedback and re-apply.</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Flights</CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{flights?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Flight requests submitted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Documents uploaded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Paid</div>
              <p className="text-xs text-muted-foreground">Registration fee</p>
            </CardContent>
          </Card>
        </div>

        {notifications && notifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification: any) => (
                  <div key={notification.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className="flex-1">
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Registered Drones</CardTitle>
            <CardDescription>Manage your registered drones</CardDescription>
          </CardHeader>
          <CardContent>
            <DronesTable drones={drones || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
