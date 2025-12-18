"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search } from "@/components/ui/icons"

type Drone = {
  id: string
  manufacturer: string
  model: string
  serial_number: string
  registration_number: string
  weight_kg: number
  max_altitude_m: number
  max_speed_kmh: number
  has_camera: boolean
  camera_resolution: string | null
  has_thermal_imaging: boolean
  is_registered: boolean
  registration_date: string
  registration_expiry: string | null
  created_at: string
}

type DronesTableProps = {
  drones: Drone[]
}

export function DronesTable({ drones }: DronesTableProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredDrones = drones.filter((drone) => {
    const query = searchQuery.toLowerCase()
    return (
      drone.manufacturer?.toLowerCase().includes(query) ||
      drone.model?.toLowerCase().includes(query) ||
      drone.serial_number?.toLowerCase().includes(query) ||
      drone.registration_number?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by manufacturer, model, serial number, or registration..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredDrones.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery ? "No drones found matching your search." : "No drones registered yet."}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Weight (kg)</TableHead>
                <TableHead>Max Altitude (m)</TableHead>
                <TableHead>Max Speed (km/h)</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrones.map((drone) => (
                <TableRow key={drone.id}>
                  <TableCell className="font-medium">{drone.manufacturer}</TableCell>
                  <TableCell>{drone.model}</TableCell>
                  <TableCell className="font-mono text-sm">{drone.serial_number}</TableCell>
                  <TableCell className="font-mono text-sm">{drone.registration_number || "N/A"}</TableCell>
                  <TableCell>{drone.weight_kg}</TableCell>
                  <TableCell>{drone.max_altitude_m}</TableCell>
                  <TableCell>{drone.max_speed_kmh}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {drone.has_camera && (
                        <Badge variant="secondary" className="text-xs">
                          Camera
                        </Badge>
                      )}
                      {drone.has_thermal_imaging && (
                        <Badge variant="secondary" className="text-xs">
                          Thermal
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={drone.is_registered ? "default" : "secondary"}>
                      {drone.is_registered ? "Registered" : "Pending"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
