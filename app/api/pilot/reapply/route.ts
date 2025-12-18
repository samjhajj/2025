import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has a pilot profile
    const { data: pilotProfile, error: profileError } = await supabase
      .from("pilot_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (profileError || !pilotProfile) {
      return NextResponse.json({ error: "Pilot profile not found" }, { status: 404 })
    }

    // Check if the profile is actually rejected
    if (pilotProfile.overall_status !== "rejected") {
      return NextResponse.json({ error: "Can only re-apply for rejected applications" }, { status: 400 })
    }

    // Reset all statuses to pending and clear rejection notes
    const { error: updateError } = await supabase
      .from("pilot_profiles")
      .update({
        overall_status: "pending",
        air_defense_status: "pending",
        logistics_status: "pending",
        intelligence_status: "pending",
        air_defense_notes: null,
        logistics_notes: null,
        intelligence_notes: null,
        air_defense_reviewed_by: null,
        logistics_reviewed_by: null,
        intelligence_reviewed_by: null,
        air_defense_reviewed_at: null,
        logistics_reviewed_at: null,
        intelligence_reviewed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    if (updateError) {
      console.error("[v0] Error resetting pilot profile:", updateError)
      return NextResponse.json({ error: "Failed to reset application status" }, { status: 500 })
    }

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "profile_updated",
      entity_type: "pilot_profile",
      entity_id: user.id,
      description: "Pilot re-applied after rejection",
      metadata: {
        previous_status: "rejected",
        new_status: "pending",
        action_type: "reapply",
      },
    })

    return NextResponse.json({ success: true, message: "Application reset successfully" })
  } catch (error) {
    console.error("[v0] Error in reapply route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
