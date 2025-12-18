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

    const { data: drones, error } = await supabase
      .from("drones")
      .select("*")
      .eq("pilot_id", pilotProfile.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(drones)
  } catch (error) {
    console.error("[v0] Drones GET error:", error)
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

    const { data: pilotProfile, error: profileError } = await supabase
      .from("pilot_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (profileError || !pilotProfile) {
      return NextResponse.json(
        { error: "Please complete your pilot profile before registering drones" },
        { status: 400 },
      )
    }

    const body = await request.json()

    const { data: drone, error } = await supabase
      .from("drones")
      .insert({
        pilot_id: pilotProfile.id,
        manufacturer: body.manufacturer,
        model: body.model,
        serial_number: body.serial_number,
        registration_number: body.registration_number || null,
        weight_kg: body.weight_kg || null,
        max_altitude_m: body.max_altitude_m || null,
        verification_status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Drone creation error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "create",
      entity_type: "drone",
      entity_id: drone.id,
      description: `Registered drone: ${body.manufacturer} ${body.model}`,
      metadata: { manufacturer: body.manufacturer, model: body.model },
    })

    return NextResponse.json(drone)
  } catch (error) {
    console.error("[v0] Drones POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
