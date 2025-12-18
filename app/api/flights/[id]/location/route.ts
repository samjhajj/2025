import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify flight belongs to user and is active
    const { data: flight } = await supabase.from("flights").select("*").eq("id", params.id).single()

    if (!flight) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 })
    }

    if (flight.pilot_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (flight.status !== "active") {
      return NextResponse.json({ error: "Flight must be active to update location" }, { status: 400 })
    }

    const body = await request.json()
    const { lat, lng, altitude } = body

    // Update flight location
    const { error: updateError } = await supabase
      .from("flights")
      .update({
        current_lat: lat,
        current_lng: lng,
        current_altitude_m: altitude,
        last_gps_update: new Date().toISOString(),
      })
      .eq("id", params.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Update location error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
