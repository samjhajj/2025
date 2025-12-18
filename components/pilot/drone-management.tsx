"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus, Plane, Trash2 } from "@/components/ui/icons"
import type { Drone } from "@/lib/types/database"

interface Props {
  drones: Drone[]
  userId: string
}

export function DroneManagement({ drones, userId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    street_address: "",
    city: "",
    county: "",
    country: "",
    manufacturer: "",
    model: "",
    serial_number: "",
    registration_number: "",
    weight_kg: "",
    max_altitude_m: "",
    max_speed_kmh: "",
    has_camera: false,
    camera_resolution: "",
    has_thermal_imaging: false,
    is_registered: false,
    registration_date: "",
    registration_expiry: "",
  })

  const [idDocument, setIdDocument] = useState<File | null>(null)
  const [insuranceDocument, setInsuranceDocument] = useState<File | null>(null)

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      street_address: "",
      city: "",
      county: "",
      country: "",
      manufacturer: "",
      model: "",
      serial_number: "",
      registration_number: "",
      weight_kg: "",
      max_altitude_m: "",
      max_speed_kmh: "",
      has_camera: false,
      camera_resolution: "",
      has_thermal_imaging: false,
      is_registered: false,
      registration_date: "",
      registration_expiry: "",
    })
    setIdDocument(null)
    setInsuranceDocument(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const submitData = new FormData()

      submitData.append("first_name", formData.first_name)
      submitData.append("last_name", formData.last_name)
      submitData.append("phone", formData.phone)
      submitData.append("email", formData.email)
      submitData.append("street_address", formData.street_address)
      submitData.append("city", formData.city)
      submitData.append("county", formData.county)
      submitData.append("country", formData.country)

      submitData.append("manufacturer", formData.manufacturer)
      submitData.append("model", formData.model)
      submitData.append("serial_number", formData.serial_number)
      submitData.append("registration_number", formData.registration_number)
      submitData.append("weight_kg", formData.weight_kg)
      submitData.append("max_altitude_m", formData.max_altitude_m)
      submitData.append("max_speed_kmh", formData.max_speed_kmh)
      submitData.append("has_camera", String(formData.has_camera))
      submitData.append("camera_resolution", formData.camera_resolution)
      submitData.append("has_thermal_imaging", String(formData.has_thermal_imaging))
      submitData.append("is_registered", String(formData.is_registered))
      submitData.append("registration_date", formData.registration_date)
      submitData.append("registration_expiry", formData.registration_expiry)

      if (idDocument) {
        submitData.append("id_document", idDocument)
      }
      if (insuranceDocument) {
        submitData.append("insurance_document", insuranceDocument)
      }

      const response = await fetch("/api/pilot/drone", {
        method: "POST",
        body: submitData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add drone")
      }

      resetForm()
      setIsDialogOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (droneId: string) => {
    if (!confirm("Are you sure you want to delete this drone?")) return

    setLoading(true)
    try {
      const response = await fetch(`/api/pilot/drone?id=${droneId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete drone")
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Your Drones</h3>
          <p className="text-sm text-muted-foreground">Manage your registered drones</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Drone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register New Drone</DialogTitle>
              <DialogDescription>
                Enter your personal information, drone details, and upload required documents
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-semibold">Pilot Information</h3>
                  <p className="text-sm text-muted-foreground">Your personal details</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="street_address">Street Address *</Label>
                    <Input
                      id="street_address"
                      value={formData.street_address}
                      onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="county">County *</Label>
                    <Input
                      id="county"
                      value={formData.county}
                      onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-semibold">Required Documents</h3>
                  <p className="text-sm text-muted-foreground">Upload your ID and insurance documents</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="id_document">National ID *</Label>
                    <Input
                      id="id_document"
                      type="file"
                      onChange={(e) => setIdDocument(e.target.files?.[0] || null)}
                      disabled={loading}
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                    />
                    <p className="text-xs text-muted-foreground">PDF, JPG, or PNG (Max 10MB)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insurance_document">Insurance Document *</Label>
                    <Input
                      id="insurance_document"
                      type="file"
                      onChange={(e) => setInsuranceDocument(e.target.files?.[0] || null)}
                      disabled={loading}
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                    />
                    <p className="text-xs text-muted-foreground">PDF, JPG, or PNG (Max 10MB)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-semibold">Drone Information</h3>
                  <p className="text-sm text-muted-foreground">Technical specifications of your drone</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer *</Label>
                    <Input
                      id="manufacturer"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      required
                      disabled={loading}
                      placeholder="e.g., DJI, Parrot"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      required
                      disabled={loading}
                      placeholder="e.g., Mavic 3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serial_number">Serial Number *</Label>
                    <Input
                      id="serial_number"
                      value={formData.serial_number}
                      onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registration_number">Registration Number</Label>
                    <Input
                      id="registration_number"
                      value={formData.registration_number}
                      onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight_kg">Weight (kg) *</Label>
                    <Input
                      id="weight_kg"
                      type="number"
                      step="0.01"
                      value={formData.weight_kg}
                      onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_altitude_m">Max Altitude (m) *</Label>
                    <Input
                      id="max_altitude_m"
                      type="number"
                      value={formData.max_altitude_m}
                      onChange={(e) => setFormData({ ...formData, max_altitude_m: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_speed_kmh">Max Speed (km/h) *</Label>
                    <Input
                      id="max_speed_kmh"
                      type="number"
                      value={formData.max_speed_kmh}
                      onChange={(e) => setFormData({ ...formData, max_speed_kmh: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="camera_resolution">Camera Resolution</Label>
                    <Input
                      id="camera_resolution"
                      value={formData.camera_resolution}
                      onChange={(e) => setFormData({ ...formData, camera_resolution: e.target.value })}
                      disabled={loading || !formData.has_camera}
                      placeholder="e.g., 4K, 1080p"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registration_date">Registration Date</Label>
                    <Input
                      id="registration_date"
                      type="date"
                      value={formData.registration_date}
                      onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registration_expiry">Registration Expiry</Label>
                    <Input
                      id="registration_expiry"
                      type="date"
                      value={formData.registration_expiry}
                      onChange={(e) => setFormData({ ...formData, registration_expiry: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has_camera"
                      checked={formData.has_camera}
                      onCheckedChange={(checked) => setFormData({ ...formData, has_camera: checked as boolean })}
                      disabled={loading}
                    />
                    <Label htmlFor="has_camera" className="cursor-pointer">
                      Has Camera
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has_thermal_imaging"
                      checked={formData.has_thermal_imaging}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, has_thermal_imaging: checked as boolean })
                      }
                      disabled={loading}
                    />
                    <Label htmlFor="has_thermal_imaging" className="cursor-pointer">
                      Has Thermal Imaging
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_registered"
                      checked={formData.is_registered}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_registered: checked as boolean })}
                      disabled={loading}
                    />
                    <Label htmlFor="is_registered" className="cursor-pointer">
                      Is Registered
                    </Label>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Register Drone
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {drones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plane className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No drones registered</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your first drone to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drones.map((drone) => (
            <Card key={drone.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {drone.manufacturer} {drone.model}
                    </CardTitle>
                    <CardDescription>S/N: {drone.serial_number}</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(drone.id)} disabled={loading}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
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
                  {drone.registration_number && (
                    <div>
                      <p className="text-muted-foreground">Registration</p>
                      <p className="font-medium">{drone.registration_number}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {drone.is_registered && <Badge variant="secondary">Registered</Badge>}
                  {drone.has_camera && <Badge variant="outline">Camera</Badge>}
                  {drone.has_thermal_imaging && <Badge variant="outline">Thermal</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
