import { redirect } from "next/navigation"
import { getSupabaseAdminClient, getCurrentUser } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Shield, Package, Eye, Map, Users, Plane } from "@/components/ui/icons"
import { PilotProfileReviewList } from "@/components/review/pilot-profile-review-list"
import { FlightReviewList } from "@/components/review/flight-review-list"
import { ActivePilotsTable } from "@/components/review/active-pilots-table"
import { DroneReviewList } from "@/components/review/drone-review-list"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"

export default async function ReviewDashboardPage() {
  const { user } = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const adminSupabase = getSupabaseAdminClient()

  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  console.log("[v0] Review page - profile query:", {
    userId: user.id,
    profile,
    error: profileError,
  })

  if (!profile || !["air_defense", "logistics", "intelligent_account", "admin"].includes(profile.role)) {
    console.log("[v0] Review page - redirecting to dashboard:", {
      hasProfile: !!profile,
      role: profile?.role,
    })
    redirect("/dashboard")
  }

  const department = profile.role as "air_defense" | "logistics" | "intelligent_account" | "admin"

  const departmentStatusColumn = `${department}_status` as const
  const { data: pendingProfiles } = await adminSupabase
    .from("pilot_profiles")
    .select("*")
    .eq(departmentStatusColumn, "pending")
    .order("created_at", { ascending: true })

  const { data: approvedProfiles } = await adminSupabase
    .from("pilot_profiles")
    .select("*")
    .eq("verification_status", "approved")
    .order("updated_at", { ascending: false })

  const profilesWithDetails = await Promise.all(
    (pendingProfiles || []).map(async (pilotProfile) => {
      const { data: userProfile } = await adminSupabase
        .from("profiles")
        .select("*")
        .eq("id", pilotProfile.user_id)
        .maybeSingle()

      const { data: drones } = await adminSupabase
        .from("drones")
        .select("*")
        .eq("pilot_id", pilotProfile.user_id)
        .order("created_at", { ascending: false })

      const { data: documents } = await adminSupabase
        .from("documents")
        .select("*")
        .eq("user_id", pilotProfile.user_id)
        .order("created_at", { ascending: false })

      return {
        ...pilotProfile,
        profiles: userProfile,
        drones: drones || [],
        documents: documents || [],
      }
    }),
  )

  const approvedProfilesWithDetails = await Promise.all(
    (approvedProfiles || []).map(async (pilotProfile) => {
      const { data: userProfile } = await adminSupabase
        .from("profiles")
        .select("*")
        .eq("id", pilotProfile.user_id)
        .maybeSingle()

      const { data: drones } = await adminSupabase
        .from("drones")
        .select("*")
        .eq("pilot_id", pilotProfile.user_id)
        .order("created_at", { ascending: false })

      const { data: documents } = await adminSupabase
        .from("documents")
        .select("*")
        .eq("user_id", pilotProfile.user_id)
        .order("created_at", { ascending: false })

      return {
        ...pilotProfile,
        profiles: userProfile || null,
        drones: drones || [],
        documents: documents || [],
      }
    }),
  )

  const { data: pendingFlights } = await adminSupabase
    .from("flights")
    .select("*, pilot_profiles!flights_pilot_id_fkey(*, profiles!pilot_profiles_user_id_fkey(*)), drones(*)")
    .eq(departmentStatusColumn, "pending")
    .order("created_at", { ascending: true })

  const droneDepartmentStatusColumn = `${department}_status` as const
  const { data: pendingDrones } = await adminSupabase
    .from("drones")
    .select("*, pilot_profiles!drones_pilot_id_fkey(full_name, phone, profiles!pilot_profiles_user_id_fkey(email))")
    .eq(droneDepartmentStatusColumn, "pending")
    .order("created_at", { ascending: true })

  const getDepartmentIcon = () => {
    switch (department) {
      case "air_defense":
        return <Shield className="h-6 w-6" />
      case "logistics":
        return <Package className="h-6 w-6" />
      case "intelligent_account":
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
      case "intelligent_account":
        return "Intelligence"
      default:
        return "Admin"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              {getDepartmentIcon()}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{getDepartmentName()} Review Dashboard</h1>
              <p className="text-muted-foreground">Review and approve pilot profiles and flight requests</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline">
              <Link href="/review/active-flights">
                <Map className="h-4 w-4 mr-2" />
                Active Flights Map
              </Link>
            </Button>
            <LogoutButton />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Profiles</CardTitle>
              <Badge variant="secondary">{profilesWithDetails?.length || 0}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profilesWithDetails?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Pilot profiles awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Flights</CardTitle>
              <Badge variant="secondary">{pendingFlights?.length || 0}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingFlights?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Flight requests awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Drones</CardTitle>
              <Badge variant="secondary">{pendingDrones?.length || 0}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingDrones?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Drones awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Pilots</CardTitle>
              <Badge variant="default" className="bg-green-600">
                {approvedProfilesWithDetails?.length || 0}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedProfilesWithDetails?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Approved and active pilots</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profiles" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profiles">
              Pilot Profiles
              {profilesWithDetails && profilesWithDetails.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {profilesWithDetails.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="flights">
              Flight Requests
              {pendingFlights && pendingFlights.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingFlights.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="drones">
              <Plane className="h-4 w-4 mr-2" />
              Drones
              {pendingDrones && pendingDrones.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingDrones.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active-pilots">
              <Users className="h-4 w-4 mr-2" />
              Active Pilots
              {approvedProfilesWithDetails && approvedProfilesWithDetails.length > 0 && (
                <Badge variant="default" className="ml-2 bg-green-600">
                  {approvedProfilesWithDetails.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles">
            <PilotProfileReviewList profiles={profilesWithDetails || []} department={department} />
          </TabsContent>

          <TabsContent value="flights">
            <FlightReviewList flights={pendingFlights || []} department={department} />
          </TabsContent>

          <TabsContent value="drones">
            <DroneReviewList drones={pendingDrones || []} />
          </TabsContent>

          <TabsContent value="active-pilots">
            <ActivePilotsTable profiles={approvedProfilesWithDetails || []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
