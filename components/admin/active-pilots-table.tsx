"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, User, Mail, Phone, MapPin, Calendar } from "lucide-react"
import type { PilotProfile, Profile } from "@/lib/types/database"
import { formatInEasternTime } from "@/lib/utils/date"

interface PilotProfileWithUser extends PilotProfile {
  profiles: Profile | null
}

interface Props {
  pilots: PilotProfileWithUser[]
}

export function ActivePilotsTable({ pilots }: Props) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredPilots = pilots.filter((pilot) => {
    const profile = pilot.profiles
    if (!profile) return false

    const searchLower = searchQuery.toLowerCase()
    const fullName = profile.full_name?.toLowerCase() || ""
    const email = profile.email?.toLowerCase() || ""
    const phone = profile.phone?.toLowerCase() || ""

    return fullName.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower)
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Active Pilots</CardTitle>
            <CardDescription>
              {filteredPilots.length} of {pilots.length} pilots displayed
            </CardDescription>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredPilots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{searchQuery ? "No pilots found" : "No active pilots"}</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Try adjusting your search query" : "No approved pilots in the system"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Approvals</TableHead>
                  <TableHead>Approved Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPilots.map((pilot) => {
                  const profile = pilot.profiles
                  const location = [pilot.city, pilot.county, pilot.country].filter(Boolean).join(", ")

                  return (
                    <TableRow key={pilot.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {profile?.full_name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{profile?.email || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{profile?.phone || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {location ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm max-w-[200px] truncate" title={location}>
                              {location}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant={pilot.air_defense_status === "approved" ? "default" : "secondary"}
                            className={`text-xs ${pilot.air_defense_status === "approved" ? "bg-green-600" : ""}`}
                          >
                            Air Defense
                          </Badge>
                          <Badge
                            variant={pilot.logistics_status === "approved" ? "default" : "secondary"}
                            className={`text-xs ${pilot.logistics_status === "approved" ? "bg-green-600" : ""}`}
                          >
                            Logistics
                          </Badge>
                          <Badge
                            variant={pilot.intelligence_status === "approved" ? "default" : "secondary"}
                            className={`text-xs ${pilot.intelligence_status === "approved" ? "bg-green-600" : ""}`}
                          >
                            Intelligence
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {pilot.updated_at ? formatInEasternTime(new Date(pilot.updated_at), "MMM d, yyyy") : "N/A"}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
