"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, User, Plane, FileText } from "lucide-react"
import type { PilotProfile, Profile, Drone, Document } from "@/lib/types/database"

interface PilotProfileWithDetails extends PilotProfile {
  profiles: Profile
  drones: Drone[]
  documents: Document[]
}

interface Props {
  profiles: PilotProfileWithDetails[]
  department: "air_defense" | "logistics" | "intelligent_account" | "admin"
}

export function PilotProfileReviewList({ profiles, department }: Props) {
  const router = useRouter()
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleReview = async (profileId: string, status: "approved" | "rejected") => {
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/review/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: profileId,
          department,
          status,
          notes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit review")
      }

      setSelectedProfile(null)
      setNotes("")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

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

  if (profiles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No pending profiles</h3>
          <p className="text-sm text-muted-foreground">All pilot profiles have been reviewed</p>
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

      {profiles.map((profile) => (
        <Card key={profile.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{profile.profiles?.full_name || "Unknown User"}</CardTitle>
                <CardDescription>{profile.profiles?.email || "No email"}</CardDescription>
              </div>
              <Badge variant="secondary">Pending Review</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Full Name</p>
                  <p className="font-medium">{profile.profiles?.full_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{profile.profiles?.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{profile.profiles?.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Street Address</p>
                  <p className="font-medium">{profile.address || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">City</p>
                  <p className="font-medium">{profile.city || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">County</p>
                  <p className="font-medium">{(profile as any).county || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Country</p>
                  <p className="font-medium">{profile.country || "N/A"}</p>
                </div>
                {profile.postal_code && (
                  <div>
                    <p className="text-muted-foreground">Postal Code</p>
                    <p className="font-medium">{profile.postal_code}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Plane className="h-4 w-4" />
                Registered Drones ({profile.drones?.length || 0})
              </h4>
              {profile.drones && profile.drones.length > 0 ? (
                <div className="space-y-3">
                  {profile.drones.map((drone) => (
                    <div key={drone.id} className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-lg">
                          {drone.manufacturer} {drone.model}
                        </p>
                        <div className="flex gap-1">
                          {drone.is_registered && <Badge variant="secondary">Registered</Badge>}
                          {drone.has_camera && <Badge variant="outline">Camera</Badge>}
                          {drone.has_thermal_imaging && <Badge variant="outline">Thermal</Badge>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Serial Number</p>
                          <p className="font-medium">{drone.serial_number}</p>
                        </div>
                        {drone.registration_number && (
                          <div>
                            <p className="text-muted-foreground">Registration Number</p>
                            <p className="font-medium">{drone.registration_number}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground">Weight</p>
                          <p className="font-medium">{drone.weight_kg} kg</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Max Altitude</p>
                          <p className="font-medium">{drone.max_altitude_m} m</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Max Speed</p>
                          <p className="font-medium">{drone.max_speed_kmh} km/h</p>
                        </div>
                        {drone.camera_resolution && (
                          <div>
                            <p className="text-muted-foreground">Camera Resolution</p>
                            <p className="font-medium">{drone.camera_resolution}</p>
                          </div>
                        )}
                        {drone.registration_date && (
                          <div>
                            <p className="text-muted-foreground">Registration Date</p>
                            <p className="font-medium">{new Date(drone.registration_date).toLocaleDateString()}</p>
                          </div>
                        )}
                        {drone.registration_expiry && (
                          <div>
                            <p className="text-muted-foreground">Registration Expiry</p>
                            <p className="font-medium">{new Date(drone.registration_expiry).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No drones registered</p>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents ({profile.documents?.length || 0})
              </h4>
              {profile.documents && profile.documents.length > 0 ? (
                <div className="space-y-2">
                  {profile.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{doc.file_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getDocumentTypeName(doc.document_type)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {doc.file_path && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={doc.file_path} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No documents uploaded</p>
              )}
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Other Department Reviews</p>
              <div className="flex gap-2 flex-wrap">
                {department !== "air_defense" &&
                  (profile as any).air_defense_status &&
                  getDepartmentStatusBadge("air_defense", (profile as any).air_defense_status)}
                {department !== "logistics" &&
                  (profile as any).logistics_status &&
                  getDepartmentStatusBadge("logistics", (profile as any).logistics_status)}
                {department !== "intelligent_account" &&
                  (profile as any).intelligent_account_status &&
                  getDepartmentStatusBadge("intelligent_account", (profile as any).intelligent_account_status)}
              </div>
            </div>

            {selectedProfile === profile.id ? (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor={`notes-${profile.id}`}>Review Notes</Label>
                  <Textarea
                    id={`notes-${profile.id}`}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes or comments about this review..."
                    rows={3}
                    disabled={loading}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleReview(profile.id, "approved")} disabled={loading} className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReview(profile.id, "rejected")}
                    disabled={loading}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedProfile(null)
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
              <Button onClick={() => setSelectedProfile(profile.id)} className="w-full">
                Review Profile
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
