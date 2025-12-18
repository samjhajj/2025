import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await getSupabaseServerClient()
    const adminSupabase = getSupabaseAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json({ error: "Invalid flight ID" }, { status: 400 })
    }

    const { data: flight, error: flightError } = await adminSupabase
      .from("flights")
      .select(`
        *,
        drones(*)
      `)
      .eq("id", params.id)
      .single()

    if (flightError || !flight) {
      console.error("[v0] Flight query error:", flightError)
      return NextResponse.json({ error: "Flight not found" }, { status: 404 })
    }

    const { data: pilotProfile } = await adminSupabase
      .from("pilot_profiles")
      .select("*")
      .eq("id", flight.pilot_id)
      .single()

    let profileData = null
    if (pilotProfile) {
      const { data: userData } = await adminSupabase
        .from("profiles")
        .select("email, role")
        .eq("id", pilotProfile.user_id)
        .single()

      profileData = {
        full_name: pilotProfile.full_name,
        email: userData?.email || "Unknown",
        phone: pilotProfile.phone_number || null,
      }
    }

    // Check if user is the pilot or a reviewer
    const { data: profile } = await adminSupabase.from("profiles").select("role").eq("id", user.id).maybeSingle()

    const isOwner = flight.pilot_id === pilotProfile?.id
    const isReviewer = profile && ["air_defense", "logistics", "intelligent_account", "admin"].includes(profile.role)

    if (!isOwner && !isReviewer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formattedFlight = {
      ...flight,
      profiles: profileData || { full_name: "Unknown", email: "Unknown", phone: null },
    }

    return NextResponse.json({ flight: formattedFlight, isOwner, isReviewer })
  } catch (error) {
    console.error("[v0] Error fetching flight:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
