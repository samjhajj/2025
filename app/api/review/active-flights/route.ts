import { NextResponse } from "next/server"
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

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!profile || !["air_defense", "logistics", "intelligent_account", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: activeFlights, error: activeError } = await supabase
      .from("flights")
      .select(
        `
        *,
        pilot:pilot_profiles!flights_pilot_id_fkey(
          id,
          full_name,
          phone,
          user_id,
          profiles:user_id(email)
        ),
        drones(*)
      `,
      )
      .eq("status", "active")
      .order("start_time", { ascending: false })

    if (activeError) {
      console.error("[v0] Error fetching active flights:", activeError)
      return NextResponse.json({ error: "Failed to fetch active flights" }, { status: 500 })
    }

    const { data: previousFlights, error: previousError } = await supabase
      .from("flights")
      .select(
        `
        *,
        pilot:pilot_profiles!flights_pilot_id_fkey(
          id,
          full_name,
          phone,
          user_id,
          profiles:user_id(email)
        ),
        drones(*)
      `,
      )
      .in("status", ["completed", "approved", "rejected"])
      .order("created_at", { ascending: false })
      .limit(50)

    if (previousError) {
      console.error("[v0] Error fetching previous flights:", previousError)
      return NextResponse.json({ error: "Failed to fetch previous flights" }, { status: 500 })
    }

    return NextResponse.json({
      activeFlights: activeFlights || [],
      previousFlights: previousFlights || [],
      department: profile.role,
    })
  } catch (error) {
    console.error("[v0] Error in active flights API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
