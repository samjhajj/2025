import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminSupabase = getSupabaseAdminClient()
    const { data: profile } = await adminSupabase.from("profiles").select("role").eq("id", user.id).maybeSingle()

    if (!profile || !["air_defense", "logistics", "intelligent_account", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { approved, notes } = body

    const { data: drone, error: droneError } = await adminSupabase
      .from("drones")
      .select("*, pilot_profiles!drones_pilot_id_fkey(full_name, user_id)")
      .eq("id", params.id)
      .single()

    if (droneError || !drone) {
      console.error("[v0] Drone not found:", droneError)
      return NextResponse.json({ error: "Drone not found" }, { status: 404 })
    }

    const statusColumn =
      profile.role === "air_defense"
        ? "air_defense_status"
        : profile.role === "logistics"
          ? "logistics_status"
          : "intelligent_account_status"

    const reviewedByColumn =
      profile.role === "air_defense"
        ? "air_defense_reviewed_by"
        : profile.role === "logistics"
          ? "logistics_reviewed_by"
          : "intelligent_account_reviewed_by"

    const reviewedAtColumn =
      profile.role === "air_defense"
        ? "air_defense_reviewed_at"
        : profile.role === "logistics"
          ? "logistics_reviewed_at"
          : "intelligent_account_reviewed_at"

    const notesColumn =
      profile.role === "air_defense"
        ? "air_defense_notes"
        : profile.role === "logistics"
          ? "logistics_notes"
          : "intelligent_account_notes"

    const updateData: any = {
      [statusColumn]: approved ? "approved" : "rejected",
      [reviewedByColumn]: user.id,
      [reviewedAtColumn]: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (notes) {
      updateData[notesColumn] = notes
    }

    const { error: updateError } = await adminSupabase.from("drones").update(updateData).eq("id", params.id)

    if (updateError) {
      console.error("[v0] Drone approval error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    await adminSupabase.from("audit_logs").insert({
      user_id: user.id,
      action: "update",
      entity_type: "drone",
      entity_id: params.id,
      description: `Drone ${drone.manufacturer} ${drone.model} ${approved ? "approved" : "rejected"} by ${profile.role}`,
      metadata: {
        manufacturer: drone.manufacturer,
        model: drone.model,
        serial_number: drone.serial_number,
        reviewer_role: profile.role,
        approval_status: approved ? "approved" : "rejected",
        notes,
      },
    })

    await adminSupabase.from("notifications").insert({
      user_id: drone.pilot_profiles.user_id,
      type: approved ? "success" : "error",
      title: `Drone ${approved ? "Approved" : "Rejected"}`,
      message: `Your drone ${drone.manufacturer} ${drone.model} has been ${approved ? "approved" : "rejected"} by ${profile.role}${notes ? `: ${notes}` : ""}`,
      entity_type: "drone",
      entity_id: params.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Drone approval error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
