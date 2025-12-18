import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const adminSupabase = getSupabaseAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await adminSupabase.from("profiles").select("role").eq("id", user.id).maybeSingle()

    if (!profile || !["air_defense", "logistics", "intelligent_account", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { flight_id, status, notes } = body

    const department = profile.role as "air_defense" | "logistics" | "intelligent_account"
    const statusColumn = `${department}_status`
    const reviewedByColumn = `${department}_reviewed_by`
    const reviewedAtColumn = `${department}_reviewed_at`
    const notesColumn = `${department}_notes`

    const updateData: any = {
      [statusColumn]: status,
      [reviewedByColumn]: user.id,
      [reviewedAtColumn]: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (notes) {
      updateData[notesColumn] = notes
    }

    const { data: flight, error: updateError } = await adminSupabase
      .from("flights")
      .update(updateData)
      .eq("id", flight_id)
      .select("pilot_id, status")
      .single()

    if (updateError) {
      console.error("[v0] Flight review error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const { data: pilotProfile } = await adminSupabase
      .from("pilot_profiles")
      .select("user_id")
      .eq("id", flight.pilot_id)
      .maybeSingle()

    const departmentNames = {
      air_defense: "Air Defense",
      logistics: "Logistics",
      intelligent_account: "Intelligence",
    }

    if (pilotProfile) {
      await adminSupabase.from("notifications").insert({
        user_id: pilotProfile.user_id,
        type: status === "approved" ? "success" : "error",
        title: `${departmentNames[department]} Flight Review ${status === "approved" ? "Approved" : "Rejected"}`,
        message:
          notes ||
          `Your flight request has been ${status} by ${departmentNames[department]}. ${flight.status === "approved" ? "Your flight is now fully approved!" : flight.status === "rejected" ? "Your flight has been rejected." : "Awaiting review from other departments."}`,
        entity_type: "flight",
        entity_id: flight_id,
      })
    }

    await adminSupabase.from("audit_logs").insert({
      user_id: user.id,
      action: status === "approved" ? "approve" : "reject",
      entity_type: "flight",
      entity_id: flight_id,
      description: `Flight ${status} by ${departmentNames[department]} reviewer`,
      metadata: { status, notes, department, overall_status: flight.status },
    })

    return NextResponse.json({ success: true, overallStatus: flight.status })
  } catch (error) {
    console.error("[v0] Flight review API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
