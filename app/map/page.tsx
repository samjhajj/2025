import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FlightMap } from "@/components/map/flight-map"

export default async function MapPage() {
  const supabase = await getSupabaseServerClient()

  // Get all active flights
  const { data: activeFlights } = await supabase
    .from("flights")
    .select("*, profiles!flights_pilot_id_fkey(*), drones(*)")
    .eq("status", "active")
    .order("actual_start", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Live Flight Map</h1>
            <p className="text-muted-foreground">Real-time tracking of active drone flights</p>
          </div>
          <Badge variant="default" className="text-lg px-4 py-2">
            {activeFlights?.length || 0} Active Flights
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Flights</CardTitle>
            <CardDescription>Live GPS tracking of all approved and active drone flights</CardDescription>
          </CardHeader>
          <CardContent>
            <FlightMap flights={activeFlights || []} />
          </CardContent>
        </Card>

        {activeFlights && activeFlights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeFlights.map((flight) => (
              <Card key={flight.id}>
                <CardHeader>
                  <CardTitle className="text-base">{flight.flight_number}</CardTitle>
                  <CardDescription>{flight.profiles.full_name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Drone</p>
                    <p className="font-medium">
                      {flight.drones.manufacturer} {flight.drones.model}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Purpose</p>
                    <p className="font-medium">{flight.purpose}</p>
                  </div>
                  {flight.current_lat && flight.current_lng && (
                    <div>
                      <p className="text-muted-foreground">Current Position</p>
                      <p className="font-mono text-xs">
                        {flight.current_lat.toFixed(6)}, {flight.current_lng.toFixed(6)}
                      </p>
                      {flight.current_altitude_m && (
                        <p className="text-xs text-muted-foreground">Altitude: {flight.current_altitude_m}m</p>
                      )}
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
