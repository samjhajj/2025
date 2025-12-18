import { redirect } from "next/navigation"
import { getSupabaseAdminClient, getCurrentUser } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plane, FileText, User, Eye, Calendar, MapPin, Plus } from "lucide-react"
import { PilotProfileForm } from "@/components/pilot/pilot-profile-form"
import { DroneManagement } from "@/components/pilot/drone-management"
import { DocumentManagement } from "@/components/pilot/document-management"
import Link from "next/link"
import { formatInEasternTime } from "@/lib/utils/date"
import { LogoutButton } from "@/components/logout-button"
import { ReapplyButton } from "@/components/pilot/reapply-button"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export default async function PilotDashboardPage() {
  const { user } = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = await getSupabaseAdminClient()

  const {
    data: { profile },
  } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "pilot") {
    redirect("/dashboard")
  }

  const timestamp = Date.now()
  const { data: pilotProfile, error: profileError } = await supabase
    .from("pilot_profiles")
    .select(`
      id,
      user_id,
      full_name,
      email,
      phone,
      date_of_birth,
      address,
      city,
      country,
      postal_code,
      license_number,
      license_expiry,
      experience_level,
      emergency_contact_name,
      emergency_contact_phone,
      verification_status,
      air_defense_status,
      air_defense_reviewed_by,
      air_defense_reviewed_at,
      air_defense_notes,
      logistics_status,
      logistics_reviewed_by,
      logistics_reviewed_at,
      logistics_notes,
      intelligent_account_status,
      intelligent_account_reviewed_by,
      intelligent_account_reviewed_at,
      intelligent_account_notes,
      created_at,
      updated_at
    `)
    .eq("user_id", user.id)
    .limit(1)
    .single()

  if (profileError) {
    console.error("[v0] Profile error:", profileError)
  }

  console.log("[v0] Pilot profile query result:", {
    hasData: !!pilotProfile,
    error: profileError,
    id: pilotProfile?.id,
    full_name: pilotProfile?.full_name,
    verification_status: pilotProfile?.verification_status,
    air_defense_status: pilotProfile?.air_defense_status,
    logistics_status: pilotProfile?.logistics_status,
    intelligent_account_status: pilotProfile?.intelligent_account_status,
  })

  console.log("[v0] Pilot profile intelligent_account_status from DB:", pilotProfile?.intelligent_account_status)

  const { data: drones } = await supabase
    .from("drones")
    .select("*")
    .eq("pilot_id", user.id)
    .order("created_at", { ascending: false })

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const { data: flights } = await supabase
    .from("flights")
    .select("*, drones(*)")
    .eq("pilot_id", user.id)
    .order("created_at", { ascending: false })

  const isRejected = () => {
    if (!pilotProfile) return false

    const overallRejected = pilotProfile.verification_status === "rejected"
    const airDefenseRejected = pilotProfile.air_defense_status === "rejected"
    const logisticsRejected = pilotProfile.logistics_status === "rejected"
    const intelligentAccountRejected = pilotProfile.intelligent_account_status === "rejected"

    return overallRejected || airDefenseRejected || logisticsRejected || intelligentAccountRejected
  }

  const getOverallStatus = () => {
    if (!pilotProfile) return "incomplete"
    return pilotProfile.verification_status || "pending"
  }

  const getStatusBadge = () => {
    const status = getOverallStatus()
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "under_review":
        return <Badge variant="secondary">Under Review</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="outline">Incomplete</Badge>
    }
  }

  const getFlightStatusBadge = (status: string) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Plane className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Pilot Dashboard</h1>
              <p className="text-muted-foreground">Manage your profile, drones, and documents</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pilot/application">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Eye className="h-4 w-4" />
                View My Application
              </Button>
            </Link>
            {isRejected() && <ReapplyButton />}
            {getStatusBadge()}
            <LogoutButton />
          </div>
        </div>

        {isRejected() && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive mb-1">Application Rejected</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your application has been rejected by one or more departments. Review the rejection notes below and
                    click "Re-apply" to update your information and resubmit.
                  </p>
                  <div className="space-y-2">
                    {pilotProfile?.air_defense_status === "rejected" && pilotProfile.air_defense_notes && (
                      <div className="text-sm">
                        <span className="font-medium">Air Defense: </span>
                        <span className="text-muted-foreground">{pilotProfile.air_defense_notes}</span>
                      </div>
                    )}
                    {pilotProfile?.logistics_status === "rejected" && pilotProfile.logistics_notes && (
                      <div className="text-sm">
                        <span className="font-medium">Logistics: </span>
                        <span className="text-muted-foreground">{pilotProfile.logistics_notes}</span>
                      </div>
                    )}
                    {pilotProfile?.intelligent_account_status === "rejected" &&
                      pilotProfile.intelligent_account_notes && (
                        <div className="text-sm">
                          <span className="font-medium">Intelligent Account: </span>
                          <span className="text-muted-foreground">{pilotProfile.intelligent_account_notes}</span>
                        </div>
                      )}
                  </div>
                </div>
                <ReapplyButton />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{getOverallStatus()}</div>
              <p className="text-xs text-muted-foreground">
                {pilotProfile ? "Profile submitted for review" : "Complete your profile"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registered Drones</CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{drones?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Active drone registrations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documents?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Uploaded documents</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList>
            <TabsTrigger value="info">
              <User className="h-4 w-4 mr-2" />
              Pilot Info
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Edit Profile
            </TabsTrigger>
            <TabsTrigger value="drones">
              <Plane className="h-4 w-4 mr-2" />
              Drones ({drones?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="flights">
              <Calendar className="h-4 w-4 mr-2" />
              Flight Requests ({flights?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Documents ({documents?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Pilot Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Personal Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Full Name</p>
                        <p className="text-sm text-muted-foreground">{profile.full_name || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{profile.email || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">{profile.phone || "Not provided"}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Address Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Street Address</p>
                        <p className="text-sm text-muted-foreground">{pilotProfile?.address || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">City</p>
                        <p className="text-sm text-muted-foreground">{pilotProfile?.city || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Country</p>
                        <p className="text-sm text-muted-foreground">{pilotProfile?.country || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Postal Code</p>
                        <p className="text-sm text-muted-foreground">{pilotProfile?.postal_code || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Approval Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Air Defense</span>
                      <Badge variant={pilotProfile?.air_defense_status === "approved" ? "default" : "secondary"}>
                        {pilotProfile?.air_defense_status || "pending"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Logistics</span>
                      <Badge variant={pilotProfile?.logistics_status === "approved" ? "default" : "secondary"}>
                        {pilotProfile?.logistics_status || "pending"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Intelligent Account</span>
                      <Badge
                        variant={pilotProfile?.intelligent_account_status === "approved" ? "default" : "secondary"}
                      >
                        {pilotProfile?.intelligent_account_status || "pending"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <PilotProfileForm profile={profile} pilotProfile={pilotProfile} />
          </TabsContent>

          <TabsContent value="drones">
            <DroneManagement drones={drones || []} userId={user.id} />
          </TabsContent>

          <TabsContent value="flights">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Flight Requests</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Submit and manage your flight approval requests
                    </p>
                  </div>
                  <Button asChild>
                    <Link href="/flights/new">
                      <Plus className="h-4 w-4 mr-2" />
                      New Flight Request
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!flights || flights.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No flight requests</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Submit your first flight request to get started
                    </p>
                    <Button asChild>
                      <Link href="/flights/new">
                        <Plus className="h-4 w-4 mr-2" />
                        New Flight Request
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {flights.map((flight) => (
                      <div key={flight.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{flight.flight_number}</h3>
                              {getFlightStatusBadge(flight.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{flight.purpose}</p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/flights/${flight.id}`}>View Details</Link>
                          </Button>
                        </div>

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

                        {flight.status !== "pending" && (
                          <div className="pt-4 border-t">
                            <p className="text-sm font-medium mb-2">Department Approvals</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant={flight.air_defense_status === "approved" ? "default" : "secondary"}>
                                Air Defense: {flight.air_defense_status || "pending"}
                              </Badge>
                              <Badge variant={flight.logistics_status === "approved" ? "default" : "secondary"}>
                                Logistics: {flight.logistics_status || "pending"}
                              </Badge>
                              <Badge
                                variant={flight.intelligent_account_status === "approved" ? "default" : "secondary"}
                              >
                                Intelligent Account: {flight.intelligent_account_status || "pending"}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <DocumentManagement documents={documents || []} userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
