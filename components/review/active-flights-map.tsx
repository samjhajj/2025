"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plane } from "@/components/ui/icons"

type Flight = {
  id: string
  flight_number: string
  current_lat: number | null
  current_lng: number | null
  current_altitude_m: number | null
  departure_lat: number
  departure_lng: number
  destination_lat: number | null
  destination_lng: number | null
  departure_location: string
  destination_location: string | null
  radius_m?: number | null
  profiles?: {
    full_name: string
  }
  drones?: {
    manufacturer: string
    model: string
  }
}

type ActiveFlightsMapProps = {
  flights: Flight[]
}

export function ActiveFlightsMap({ flights }: ActiveFlightsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return

    if (flights.length === 0) {
      console.log("[v0] No flights to display on map")
      return
    }

    console.log("[v0] Rendering map with flights:", flights.length)
    flights.forEach((flight, index) => {
      console.log(`[v0] Map Flight ${index + 1}:`, {
        id: flight.id,
        flight_number: flight.flight_number,
        departure_lat: flight.departure_lat,
        departure_lng: flight.departure_lng,
        current_lat: flight.current_lat,
        current_lng: flight.current_lng,
      })
    })

    const loadLeafletCSS = () => {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }
      if (!document.getElementById("leaflet-markercluster-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-markercluster-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"
        document.head.appendChild(link)
      }
      if (!document.getElementById("leaflet-markercluster-default-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-markercluster-default-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css"
        document.head.appendChild(link)
      }
    }

    // Initialize Leaflet map
    const initMap = async () => {
      loadLeafletCSS()

      const L = (await import("leaflet")).default
      await import("leaflet.markercluster")

      // Fix for default marker icons in Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      // Clear existing map if any
      mapRef.current!.innerHTML = ""

      const validFlights = flights.filter(
        (f) => !isNaN(f.current_lat || f.departure_lat) && !isNaN(f.current_lng || f.departure_lng),
      )

      if (validFlights.length === 0) {
        console.error("[v0] No valid flight coordinates found")
        return
      }

      const avgLat = validFlights.reduce((sum, f) => sum + (f.current_lat || f.departure_lat), 0) / validFlights.length
      const avgLng = validFlights.reduce((sum, f) => sum + (f.current_lng || f.departure_lng), 0) / validFlights.length

      console.log(`[v0] Setting map center to [${avgLat}, ${avgLng}]`)

      const map = L.map(mapRef.current!).setView([avgLat, avgLng], 10)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      // Custom drone icon
      const droneIcon = L.divIcon({
        html: `<div style="background: #3b82f6; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
          </svg>
        </div>`,
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      const markers = (L as any).markerClusterGroup({
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 50,
      })

      // Add markers for each flight
      flights.forEach((flight) => {
        const currentLat = flight.current_lat || flight.departure_lat
        const currentLng = flight.current_lng || flight.departure_lng

        console.log(`[v0] Creating marker for ${flight.flight_number} at [${currentLat}, ${currentLng}]`)

        // Current position marker
        const marker = L.marker([currentLat, currentLng], { icon: droneIcon })

        const routeInfo = flight.destination_location
          ? `${flight.departure_location} → ${flight.destination_location}`
          : `${flight.departure_location} (${flight.radius_m || 0}m radius)`

        marker.bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 8px;">${flight.flight_number}</h3>
            <p style="margin: 4px 0;"><strong>Pilot:</strong> ${flight.profiles?.full_name || "Unknown"}</p>
            <p style="margin: 4px 0;"><strong>Drone:</strong> ${flight.drones?.manufacturer} ${flight.drones?.model}</p>
            <p style="margin: 4px 0;"><strong>Altitude:</strong> ${flight.current_altitude_m || 0}m</p>
            <p style="margin: 4px 0;"><strong>Area:</strong> ${routeInfo}</p>
          </div>
        `)

        marker.on("click", () => {
          setSelectedFlight(flight)
        })

        markers.addLayer(marker)

        if (flight.destination_lat && flight.destination_lng) {
          // Draw route line from departure to destination
          const routeLine = L.polyline(
            [
              [flight.departure_lat, flight.departure_lng],
              [flight.destination_lat, flight.destination_lng],
            ],
            {
              color: "#3b82f6",
              weight: 2,
              opacity: 0.5,
              dashArray: "5, 10",
            },
          ).addTo(map)

          // Add destination marker
          L.circleMarker([flight.destination_lat, flight.destination_lng], {
            radius: 6,
            fillColor: "#ef4444",
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          })
            .addTo(map)
            .bindPopup(`<strong>Destination:</strong> ${flight.destination_location}`)
        } else if (flight.radius_m) {
          L.circle([flight.departure_lat, flight.departure_lng], {
            radius: flight.radius_m,
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.1,
            weight: 2,
          }).addTo(map)
        }

        // Add departure marker
        L.circleMarker([flight.departure_lat, flight.departure_lng], {
          radius: 6,
          fillColor: "#10b981",
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        })
          .addTo(map)
          .bindPopup(`<strong>Departure:</strong> ${flight.departure_location}`)
      })

      map.addLayer(markers)

      // Fit map to show all markers
      if (flights.length > 0) {
        const bounds = L.latLngBounds(
          flights.map((f) => [f.current_lat || f.departure_lat, f.current_lng || f.departure_lng]),
        )
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    }

    initMap()
  }, [flights])

  if (flights.length === 0) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-lg">
        <div className="text-center space-y-2">
          <Plane className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-lg font-medium">No Active Flights</p>
          <p className="text-sm text-muted-foreground">There are currently no drones in flight</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div ref={mapRef} className="h-[600px] w-full rounded-lg overflow-hidden" />

      {selectedFlight && (
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">{selectedFlight.flight_number}</h3>
                <Badge variant="default">In Progress</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Pilot</p>
                  <p className="font-medium">{selectedFlight.profiles?.full_name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Drone</p>
                  <p className="font-medium">
                    {selectedFlight.drones?.manufacturer} {selectedFlight.drones?.model}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Altitude</p>
                  <p className="font-medium">{selectedFlight.current_altitude_m || 0}m</p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {selectedFlight.destination_location ? "Route" : "Operation Area"}
                  </p>
                  <p className="font-medium">
                    {selectedFlight.destination_location
                      ? `${selectedFlight.departure_location} → ${selectedFlight.destination_location}`
                      : `${selectedFlight.departure_location} (${selectedFlight.radius_m || 0}m radius)`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
