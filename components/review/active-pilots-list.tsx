"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Plane, FileText, Mail, Phone, MapPin, Calendar, CheckCircle2, AlertCircle } from "lucide-react"
import type { PilotProfile, Profile, Drone, Document } from "@/lib/types/database"
import { formatInEasternTime } from "@/lib/utils/date"

interface PilotProfileWithDetails extends PilotProfile {
  profiles: Profile | null
  drones: Drone[]
  documents: Document[]
}

interface Props {
  profiles: PilotProfileWithDetails[]
}

export function ActivePilotsList({ profiles }: Props) {
  const getDocumentTypeName = (type: string) => {
    switch (type) {
      case "national_id":
        return "National ID"
      case "insurance":
        return "Insurance"
      case "drone_registration":
        return "Drone Registration"
      default:
        return type
    }
  }

  console.log("[v0] ActivePilotsList - Total profiles:", profiles.length)
  profiles.forEach((profile, index) => {
    console.log(`[v0] Profile ${index + 1}:`, {
      pilotProfileId: profile.id,
      userId: profile.user_id,
      hasUserProfile: !!profile.profiles,
      fullName: profile.profiles?.full_name || "MISSING",
      email: profile.profiles?.email || "MISSING",
      phone: profile.profiles?.phone || "MISSING",
      dronesCount: profile.drones?.length || 0,
      documentsCount: profile.documents?.length || 0,
      profilesObject: profile.profiles,
    })
  })

  if (profiles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No active pilots</h3>
          <p className="text-sm text-muted-foreground">No approved pilots found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Active Pilots ({profiles.length})</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {profiles.map((profile) => {
          const userProfile = profile.profiles
          const fullName = userProfile?.full_name || "Name not available"
          const email = userProfile?.email || null
          const phone = userProfile?.phone || null
          const hasContactInfo = !!(email || phone)

          return (
            <Card key={profile.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 shrink-0" />
                      <span className="truncate">{fullName}</span>
                      {!userProfile && (
                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" title="Profile data missing" />
                      )}
                    </CardTitle>

                    <CardDescription className="space-y-1">
                      {email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{email}</span>
                        </div>
                      )}
                      {phone && (
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{phone}</span>
                        </div>
                      )}
                      {!hasContactInfo && (
                        <div className="flex items-center gap-2 text-xs text-amber-600">
                          <AlertCircle className="h-3 w-3" />
                          <span>No contact information available</span>
                        </div>
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="bg-green-600 shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Location Information */}
                {(profile.address || profile.city || profile.country) && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      {profile.address && <p className="font-medium truncate">{profile.address}</p>}
                      <p className="text-muted-foreground truncate">
                        {[profile.city, profile.county, profile.country].filter(Boolean).join(", ")}
                      </p>
                      {profile.postal_code && <p className="text-xs text-muted-foreground">{profile.postal_code}</p>}
                    </div>
                  </div>
                )}

                <div className="border-t pt-3">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents Uploaded ({profile.documents?.length || 0})
                  </h4>
                  {profile.documents && profile.documents.length > 0 ? (
                    <div className="space-y-2">
                      {profile.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between bg-muted/50 rounded-lg p-3 hover:bg-muted/70 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="h-5 w-5 text-primary shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{getDocumentTypeName(doc.document_type)}</p>
                              {doc.file_name && (
                                <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                              )}
                              {doc.uploaded_at && (
                                <p className="text-xs text-muted-foreground">
                                  Uploaded: {formatInEasternTime(new Date(doc.uploaded_at), "MMM d, yyyy")}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0 ml-2">
                            {doc.scan_status || "Uploaded"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center">
                      <FileText className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">No documents uploaded</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        This pilot has not uploaded any documents yet
                      </p>
                    </div>
                  )}
                </div>

                {/* Registered Drones */}
                <div className="border-t pt-3">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    Registered Drones ({profile.drones?.length || 0})
                  </h4>
                  {profile.drones && profile.drones.length > 0 ? (
                    <div className="space-y-2">
                      {profile.drones.map((drone) => (
                        <div key={drone.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm">
                              {drone.manufacturer} {drone.model}
                            </p>
                            <div className="flex gap-1 flex-wrap justify-end">
                              {drone.is_registered && (
                                <Badge variant="secondary" className="text-xs">
                                  Registered
                                </Badge>
                              )}
                              {drone.has_camera && (
                                <Badge variant="outline" className="text-xs">
                                  Camera
                                </Badge>
                              )}
                              {drone.has_thermal_imaging && (
                                <Badge variant="outline" className="text-xs">
                                  Thermal
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">Serial Number</p>
                              <p className="font-medium truncate">{drone.serial_number}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Weight</p>
                              <p className="font-medium">{drone.weight_kg} kg</p>
                            </div>
                          </div>
                          {drone.registration_number && (
                            <div className="text-xs pt-2 border-t">
                              <p className="text-muted-foreground">Registration: {drone.registration_number}</p>
                              {drone.registration_expiry && (
                                <p className="text-muted-foreground">
                                  Expires: {formatInEasternTime(new Date(drone.registration_expiry), "MMM d, yyyy")}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-lg p-4 text-center">
                      <Plane className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No drones registered</p>
                    </div>
                  )}
                </div>

                {/* Department Approvals */}
                <div className="border-t pt-3">
                  <p className="text-xs font-medium mb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Department Approvals
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge
                      variant={profile.air_defense_status === "approved" ? "default" : "secondary"}
                      className={profile.air_defense_status === "approved" ? "bg-green-600" : ""}
                    >
                      Air Defense
                    </Badge>
                    <Badge
                      variant={profile.logistics_status === "approved" ? "default" : "secondary"}
                      className={profile.logistics_status === "approved" ? "bg-green-600" : ""}
                    >
                      Logistics
                    </Badge>
                    <Badge
                      variant={profile.intelligence_status === "approved" ? "default" : "secondary"}
                      className={profile.intelligence_status === "approved" ? "bg-green-600" : ""}
                    >
                      Intelligence
                    </Badge>
                  </div>
                </div>

                {/* Approval Date */}
                {profile.updated_at && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground border-t pt-3">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Approved: {formatInEasternTime(new Date(profile.updated_at), "MMM d, yyyy 'at' h:mm a zzz")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
