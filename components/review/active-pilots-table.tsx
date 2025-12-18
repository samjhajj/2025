"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Eye,
  FileText,
  Plane,
  CheckCircle,
  XCircle,
} from "lucide-react"
import type { PilotProfile, Profile, Drone, Document } from "@/lib/types/database"
import { formatInEasternTime } from "@/lib/utils/date"
import { useRouter } from "next/navigation"

interface PilotProfileWithDetails extends PilotProfile {
  profiles: Profile | null
  drones: Drone[]
  documents: Document[]
}

interface Props {
  profiles: PilotProfileWithDetails[]
}

export function ActivePilotsTable({ profiles }: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProfile, setSelectedProfile] = useState<PilotProfileWithDetails | null>(null)
  const [verifyingDocId, setVerifyingDocId] = useState<string | null>(null)
  const [verifyAction, setVerifyAction] = useState<"verify" | "reject" | null>(null)
  const [verifyNotes, setVerifyNotes] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const router = useRouter()

  const filteredProfiles = profiles.filter((profile) => {
    const query = searchQuery.toLowerCase()
    const fullName = profile.profiles?.full_name?.toLowerCase() || ""
    const email = profile.profiles?.email?.toLowerCase() || ""
    const phone = profile.profiles?.phone?.toLowerCase() || ""

    return fullName.includes(query) || email.includes(query) || phone.includes(query)
  })

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

  const handleVerifyDocument = async (documentId: string, action: "verify" | "reject") => {
    setIsVerifying(true)
    try {
      const response = await fetch(`/api/review/documents/${documentId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: verifyNotes }),
      })

      if (!response.ok) {
        throw new Error("Failed to verify document")
      }

      setVerifyingDocId(null)
      setVerifyAction(null)
      setVerifyNotes("")
      router.refresh()
    } catch (error) {
      console.error("[v0] Error verifying document:", error)
      alert("Failed to verify document. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Active Pilots ({profiles.length})
              </CardTitle>
              <CardDescription>All approved and active pilots in the system</CardDescription>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pilot Name</TableHead>
                  <TableHead>Contact Information</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Department Approvals</TableHead>
                  <TableHead>Approval Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No pilots found matching "{searchQuery}"
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles.map((profile) => {
                    const userProfile = profile.profiles
                    const fullName = userProfile?.full_name || "Name not available"
                    const email = userProfile?.email || "No email"
                    const phone = userProfile?.phone || "No phone"
                    const location = [profile.city, profile.country].filter(Boolean).join(", ") || "Not specified"

                    return (
                      <TableRow key={profile.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{fullName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate max-w-[200px]">{email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[150px]">{location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge
                              variant={profile.air_defense_status === "approved" ? "default" : "secondary"}
                              className={profile.air_defense_status === "approved" ? "bg-green-600 text-xs" : "text-xs"}
                            >
                              {profile.air_defense_status === "approved" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              Air Defense
                            </Badge>
                            <Badge
                              variant={profile.logistics_status === "approved" ? "default" : "secondary"}
                              className={profile.logistics_status === "approved" ? "bg-green-600 text-xs" : "text-xs"}
                            >
                              {profile.logistics_status === "approved" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              Logistics
                            </Badge>
                            <Badge
                              variant={profile.intelligence_status === "approved" ? "default" : "secondary"}
                              className={
                                profile.intelligence_status === "approved" ? "bg-green-600 text-xs" : "text-xs"
                              }
                            >
                              {profile.intelligence_status === "approved" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              Intelligence
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatInEasternTime(new Date(profile.updated_at), "MMM d, yyyy")}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedProfile(profile)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Profile
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <User className="h-5 w-5" />
                                  {fullName}
                                </DialogTitle>
                                <DialogDescription>Complete pilot profile and registered drones</DialogDescription>
                              </DialogHeader>

                              <div className="space-y-6 mt-4">
                                <div className="space-y-3">
                                  <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Contact Information
                                  </h3>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Email</p>
                                      <p className="font-medium">{email}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Phone</p>
                                      <p className="font-medium">{phone}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3 border-t pt-4">
                                  <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Location
                                  </h3>
                                  <div className="text-sm space-y-1">
                                    {profile.address && <p className="font-medium">{profile.address}</p>}
                                    <p className="text-muted-foreground">
                                      {[profile.city, profile.county, profile.country].filter(Boolean).join(", ")}
                                    </p>
                                    {profile.postal_code && (
                                      <p className="text-xs text-muted-foreground">{profile.postal_code}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-3 border-t pt-4">
                                  <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Documents ({profile.documents?.length || 0})
                                  </h3>
                                  {profile.documents && profile.documents.length > 0 ? (
                                    <div className="space-y-2">
                                      {profile.documents.map((doc) => (
                                        <div
                                          key={doc.id}
                                          className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
                                        >
                                          <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <FileText className="h-5 w-5 text-primary shrink-0" />
                                            <div className="min-w-0 flex-1">
                                              <p className="text-sm font-medium">
                                                {getDocumentTypeName(doc.document_type)}
                                              </p>
                                              {doc.file_name && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                  {doc.file_name}
                                                </p>
                                              )}
                                              {doc.uploaded_at && (
                                                <p className="text-xs text-muted-foreground">
                                                  Uploaded:{" "}
                                                  {formatInEasternTime(new Date(doc.uploaded_at), "MMM d, yyyy")}
                                                </p>
                                              )}
                                              {doc.description && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                  Note: {doc.description}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0 ml-2">
                                            <Badge
                                              variant={
                                                doc.scan_status === "verified"
                                                  ? "default"
                                                  : doc.scan_status === "rejected"
                                                    ? "destructive"
                                                    : "secondary"
                                              }
                                              className={`text-xs ${doc.scan_status === "verified" ? "bg-green-600" : ""}`}
                                            >
                                              {doc.scan_status === "pending"
                                                ? "Pending Verification"
                                                : doc.scan_status === "verified"
                                                  ? "Verified"
                                                  : doc.scan_status === "rejected"
                                                    ? "Rejected"
                                                    : doc.scan_status || "Uploaded"}
                                            </Badge>
                                            {doc.file_path && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2"
                                                onClick={() => window.open(doc.file_path, "_blank")}
                                              >
                                                <Eye className="h-4 w-4" />
                                              </Button>
                                            )}
                                            {doc.scan_status === "pending" && (
                                              <>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                  onClick={() => {
                                                    setVerifyingDocId(doc.id)
                                                    setVerifyAction("verify")
                                                  }}
                                                >
                                                  <CheckCircle className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                  onClick={() => {
                                                    setVerifyingDocId(doc.id)
                                                    setVerifyAction("reject")
                                                  }}
                                                >
                                                  <XCircle className="h-4 w-4" />
                                                </Button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">No documents uploaded</p>
                                  )}
                                </div>

                                <div className="space-y-3 border-t pt-4">
                                  <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Plane className="h-4 w-4" />
                                    Registered Drones ({profile.drones?.length || 0})
                                  </h3>
                                  {profile.drones && profile.drones.length > 0 ? (
                                    <div className="space-y-3">
                                      {profile.drones.map((drone) => (
                                        <div key={drone.id} className="bg-muted/50 rounded-lg p-4 space-y-3">
                                          <div className="flex items-center justify-between gap-2">
                                            <p className="font-medium">
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
                                          <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                              <p className="text-muted-foreground">Serial Number</p>
                                              <p className="font-medium truncate">{drone.serial_number}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Weight</p>
                                              <p className="font-medium">{drone.weight_kg} kg</p>
                                            </div>
                                            {drone.max_flight_time && (
                                              <div>
                                                <p className="text-muted-foreground">Max Flight Time</p>
                                                <p className="font-medium">{drone.max_flight_time} min</p>
                                              </div>
                                            )}
                                            {drone.max_altitude && (
                                              <div>
                                                <p className="text-muted-foreground">Max Altitude</p>
                                                <p className="font-medium">{drone.max_altitude} m</p>
                                              </div>
                                            )}
                                          </div>
                                          {drone.registration_number && (
                                            <div className="text-sm pt-2 border-t space-y-1">
                                              <p className="text-muted-foreground">
                                                Registration: {drone.registration_number}
                                              </p>
                                              {drone.registration_expiry && (
                                                <p className="text-muted-foreground">
                                                  Expires:{" "}
                                                  {formatInEasternTime(
                                                    new Date(drone.registration_expiry),
                                                    "MMM d, yyyy",
                                                  )}
                                                </p>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">No drones registered</p>
                                  )}
                                </div>

                                <div className="space-y-3 border-t pt-4">
                                  <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Department Approvals
                                  </h3>
                                  <div className="flex flex-wrap gap-2">
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

                                {profile.updated_at && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-4">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      Approved:{" "}
                                      {formatInEasternTime(new Date(profile.updated_at), "MMM d, yyyy 'at' h:mm a zzz")}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {filteredProfiles.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredProfiles.length} of {profiles.length} active pilots
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={verifyingDocId !== null} onOpenChange={(open) => !open && setVerifyingDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{verifyAction === "verify" ? "Verify Document" : "Reject Document"}</AlertDialogTitle>
            <AlertDialogDescription>
              {verifyAction === "verify"
                ? "Are you sure you want to verify this document? The pilot will be notified."
                : "Are you sure you want to reject this document? Please provide a reason for rejection."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder={verifyAction === "verify" ? "Optional notes..." : "Reason for rejection (required)"}
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setVerifyingDocId(null)
                setVerifyAction(null)
                setVerifyNotes("")
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => verifyingDocId && verifyAction && handleVerifyDocument(verifyingDocId, verifyAction)}
              disabled={isVerifying || (verifyAction === "reject" && !verifyNotes.trim())}
              className={verifyAction === "verify" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {isVerifying ? "Processing..." : verifyAction === "verify" ? "Verify" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
