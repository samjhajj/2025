import { redirect } from "next/navigation"
import { getSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, User, Plane, FileText, MapPin, Phone, Mail, Calendar, Shield } from "lucide-react"
import Link from "next/link"

export default async function PilotApplicationPage() {
  const { user } = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = await getSupabaseServerClient()

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "pilot") {
    redirect("/dashboard")
  }

  // Get pilot profile
  const { data: pilotProfile } = await supabase.from("pilot_profiles").select("*").eq("user_id", user.id).single()

  // Get drones
  const { data: drones } = await supabase
    .from("drones")
    .select("*")
    .eq("pilot_id", user.id)
    .order("created_at", { ascending: false })

  // Get documents
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const getStatusBadge = (status: string) => {
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
        return <Badge variant="outline">Not Submitted</Badge>
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-6 space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <Link href="/pilot">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">My Application</h1>
          <p className="text-muted-foreground">Complete view of your drone pilot application</p>
        </div>

        {/* Pilot Profile Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>Pilot Profile</CardTitle>
              </div>
              {pilotProfile && getStatusBadge(pilotProfile.overall_status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{profile.full_name || "Not provided"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{profile.email || "Not provided"}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Phone</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{profile.phone || "Not provided"}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Address</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{pilotProfile?.address || "Not provided"}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">City</p>
                <p className="font-medium">{pilotProfile?.city || "Not provided"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Country</p>
                <p className="font-medium">{pilotProfile?.country || "Not provided"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Postal Code</p>
                <p className="font-medium">{pilotProfile?.postal_code || "Not provided"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Submitted On</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{formatDate(pilotProfile?.created_at || null)}</p>
                </div>
              </div>
            </div>

            {pilotProfile && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold">Department Review Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Air Defense</p>
                      {getStatusBadge(pilotProfile.air_defense_status)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Civil Aviation</p>
                      {getStatusBadge(pilotProfile.civil_aviation_status)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Police</p>
                      {getStatusBadge(pilotProfile.police_status)}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Registered Drones */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              <CardTitle>Registered Drones ({drones?.length || 0})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {!drones || drones.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No drones registered yet</p>
            ) : (
              <div className="space-y-4">
                {drones.map((drone, index) => (
                  <div key={drone.id}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">
                          {drone.manufacturer} {drone.model}
                        </h3>
                        {drone.is_registered && <Badge className="bg-green-500">Registered</Badge>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Serial Number</p>
                          <p className="font-medium">{drone.serial_number || "N/A"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Registration Number</p>
                          <p className="font-medium">{drone.registration_number || "N/A"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Weight</p>
                          <p className="font-medium">{drone.weight_kg ? `${drone.weight_kg} kg` : "N/A"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Max Altitude</p>
                          <p className="font-medium">{drone.max_altitude_m ? `${drone.max_altitude_m} m` : "N/A"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Max Speed</p>
                          <p className="font-medium">{drone.max_speed_kmh ? `${drone.max_speed_kmh} km/h` : "N/A"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Camera</p>
                          <p className="font-medium">
                            {drone.has_camera ? `Yes (${drone.camera_resolution || "N/A"})` : "No"}
                          </p>
                        </div>
                        {drone.has_thermal_imaging && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Thermal Imaging</p>
                            <p className="font-medium">Yes</p>
                          </div>
                        )}
                        {drone.registration_date && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Registration Date</p>
                            <p className="font-medium">{formatDate(drone.registration_date)}</p>
                          </div>
                        )}
                        {drone.registration_expiry && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Registration Expiry</p>
                            <p className="font-medium">{formatDate(drone.registration_expiry)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>Documents ({documents?.length || 0})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {!documents || documents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No documents uploaded yet</p>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium capitalize">{doc.document_type.replace(/_/g, " ")}</p>
                        <p className="text-sm text-muted-foreground">Uploaded {formatDate(doc.created_at)}</p>
                      </div>
                    </div>
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          View Document
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
