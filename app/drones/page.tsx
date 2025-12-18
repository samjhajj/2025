import { redirect } from "next/navigation"
import { getSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plane, Plus, ArrowLeft } from "@/components/ui/icons"
import Link from "next/link"

export default async function DronesPage() {
  const { user } = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = await getSupabaseServerClient()

  const { data: drones } = await supabase
    .from("drones")
    .select("*")
    .eq("pilot_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Drones</h1>
            <p className="text-muted-foreground">Manage your registered drones</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Link>
            </Button>
            <Button asChild>
              <Link href="/drones/new">
                <Plus className="h-4 w-4 mr-2" />
                Register Drone
              </Link>
            </Button>
          </div>
        </div>

        {!drones || drones.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Plane className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No drones registered</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Register your first drone to start submitting flight requests
              </p>
              <Button asChild>
                <Link href="/drones/new">Register Drone</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drones.map((drone) => (
              <Card key={drone.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>
                        {drone.manufacturer} {drone.model}
                      </CardTitle>
                      <CardDescription>S/N: {drone.serial_number}</CardDescription>
                    </div>
                    {drone.is_registered && <Badge>Registered</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
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
                    <div>
                      <p className="text-muted-foreground">Camera</p>
                      <p className="font-medium">{drone.has_camera ? "Yes" : "No"}</p>
                    </div>
                  </div>
                  {drone.registration_number && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Registration #</p>
                      <p className="text-sm font-mono">{drone.registration_number}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
