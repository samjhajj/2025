import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: pilotProfile } = await supabase.from("pilot_profiles").select("id").eq("user_id", user.id).single()

    if (!pilotProfile) {
      return NextResponse.json([])
    }

    const { data: flights, error } = await supabase
      .from("flights")
      .select("*, drones(*)")
      .eq("pilot_id", pilotProfile.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Flights GET error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(flights)
  } catch (error) {
    console.error("[v0] Flights GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: pilotProfile } = await supabase
      .from("pilot_profiles")
      .select("id, verification_status")
      .eq("user_id", user.id)
      .single()

    if (!pilotProfile) {
      return NextResponse.json({ error: "Please complete your pilot profile first" }, { status: 403 })
    }

    if (pilotProfile.verification_status === "rejected") {
      return NextResponse.json(
        { error: "Your pilot profile has been rejected. Please update your information and resubmit." },
        { status: 403 },
      )
    }

    const body = await request.json()

    const { data: flight, error } = await supabase
      .from("flights")
      .insert({
        pilot_id: pilotProfile.id,
        drone_id: body.drone_id,
        location: body.departure_location,
        latitude: body.departure_lat,
        longitude: body.departure_lng,
        purpose: body.purpose,
        max_altitude_m: body.max_altitude_m,
        start_time: body.scheduled_start,
        end_time: body.scheduled_end,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Flight creation error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const reviewerRoles = ["air_defense", "logistics", "intelligent_account"]
    const { data: reviewers } = await supabase.from("profiles").select("id").in("role", reviewerRoles)

    if (reviewers) {
      const notifications = reviewers.map((reviewer) => ({
        user_id: reviewer.id,
        type: "info",
        title: "New Flight Request",
        message: `A new flight request requires review`,
        entity_type: "flight",
        entity_id: flight.id,
      }))

      await supabase.from("notifications").insert(notifications)
    }

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "create",
      entity_type: "flight",
      entity_id: flight.id,
      description: `Flight request submitted for ${body.purpose}`,
      metadata: { purpose: body.purpose, location: body.departure_location },
    })

    return NextResponse.json(flight)
  } catch (error) {
    console.error("[v0] Flights POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
