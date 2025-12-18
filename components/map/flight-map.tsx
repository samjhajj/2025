"use client"

import { useEffect, useRef } from "react"
import type { Flight, Profile, Drone } from "@/lib/types/database"

interface FlightWithDetails extends Flight {
  profiles: Profile
  drones: Drone
}

interface Props {
  flights: FlightWithDetails[]
}

export function FlightMap({ flights }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return

    // Dynamically import Leaflet only on client side
    import("leaflet").then((L) => {
      // Clean up existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }

      // Create map centered on first flight or default location
      const center: [number, number] =
        flights.length > 0 && flights[0].current_lat && flights[0].current_lng
          ? [flights[0].current_lat, flights[0].current_lng]
          : [40.7128, -74.006] // Default to New York

      const map = L.map(mapRef.current).setView(center, 10)
      mapInstanceRef.current = map

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      // Add markers for each flight
      flights.forEach((flight) => {
        if (flight.current_lat && flight.current_lng) {
          // Create custom icon for active drone
          const droneIcon = L.divIcon({
            className: "custom-drone-marker",
            html: `
              <div style="
                background: #3b82f6;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
                </svg>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })

          const marker = L.marker([flight.current_lat, flight.current_lng], { icon: droneIcon }).addTo(map)

          // Add popup with flight details
          marker.bindPopup(`
            <div style="min-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 8px;">${flight.flight_number}</h3>
              <p style="margin: 4px 0;"><strong>Pilot:</strong> ${flight.profiles.full_name}</p>
              <p style="margin: 4px 0;"><strong>Drone:</strong> ${flight.drones.manufacturer} ${flight.drones.model}</p>
              <p style="margin: 4px 0;"><strong>Purpose:</strong> ${flight.purpose}</p>
              ${flight.current_altitude_m ? `<p style="margin: 4px 0;"><strong>Altitude:</strong> ${flight.current_altitude_m}m</p>` : ""}
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                Last update: ${flight.last_gps_update ? new Date(flight.last_gps_update).toLocaleTimeString() : "N/A"}
              </p>
            </div>
          `)

          // Draw departure location
          const departureIcon = L.divIcon({
            className: "custom-departure-marker",
            html: `
              <div style="
                background: #10b981;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              "></div>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })

          L.marker([flight.departure_lat, flight.departure_lng], { icon: departureIcon })
            .addTo(map)
            .bindPopup(`<strong>Departure:</strong> ${flight.departure_location}`)

          // Draw line from departure to current position
          L.polyline(
            [
              [flight.departure_lat, flight.departure_lng],
              [flight.current_lat, flight.current_lng],
            ],
            {
              color: "#3b82f6",
              weight: 2,
              opacity: 0.6,
              dashArray: "5, 10",
            },
          ).addTo(map)

          // Draw destination if exists
          if (flight.destination_lat && flight.destination_lng) {
            const destinationIcon = L.divIcon({
              className: "custom-destination-marker",
              html: `
                <div style="
                  background: #ef4444;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  border: 2px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                "></div>
              `,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })

            L.marker([flight.destination_lat, flight.destination_lng], { icon: destinationIcon })
              .addTo(map)
              .bindPopup(`<strong>Destination:</strong> ${flight.destination_location}`)
          }
        }
      })

      // Fit bounds to show all markers if there are flights
      if (flights.length > 0) {
        const bounds = flights
          .filter((f) => f.current_lat && f.current_lng)
          .map((f) => [f.current_lat!, f.current_lng!] as [number, number])

        if (bounds.length > 0) {
          map.fitBounds(bounds, { padding: [50, 50] })
        }
      }
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }
    }
  }, [flights])

  return (
    <div>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ height: "600px", width: "100%", borderRadius: "8px" }} />
    </div>
  )
}
