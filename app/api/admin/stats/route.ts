import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { subDays, format } from "date-fns"

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get flights by status
    const { data: flights } = await supabase.from("flights").select("status")

    const flightsByStatus: Record<string, number> = {}
    flights?.forEach((flight) => {
      flightsByStatus[flight.status] = (flightsByStatus[flight.status] || 0) + 1
    })

    // Get pilot profiles by status
    const { data: profiles } = await supabase.from("pilot_profiles").select("overall_status")

    const profilesByStatus: Record<string, number> = {}
    profiles?.forEach((profile) => {
      profilesByStatus[profile.overall_status] = (profilesByStatus[profile.overall_status] || 0) + 1
    })

    // Get recent activity (last 7 days)
    const recentActivity = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = format(date, "yyyy-MM-dd")

      const { count: flightCount } = await supabase
        .from("flights")
        .select("*", { count: "exact", head: true })
        .gte("created_at", `${dateStr}T00:00:00`)
        .lt("created_at", `${dateStr}T23:59:59`)

      const { count: regCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "pilot")
        .gte("created_at", `${dateStr}T00:00:00`)
        .lt("created_at", `${dateStr}T23:59:59`)

      recentActivity.push({
        date: format(date, "MMM d"),
        flights: flightCount || 0,
        registrations: regCount || 0,
      })
    }

    return NextResponse.json({
      flightsByStatus,
      profilesByStatus,
      recentActivity,
    })
  } catch (error) {
    console.error("[v0] Admin stats API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
