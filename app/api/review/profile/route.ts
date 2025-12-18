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
    const { profile_id, status, notes } = body

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

    const { data: pilotProfile, error: updateError } = await adminSupabase
      .from("pilot_profiles")
      .update(updateData)
      .eq("id", profile_id)
      .select("user_id, verification_status")
      .single()

    if (updateError) {
      console.error("[v0] Profile review error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const departmentNames = {
      air_defense: "Air Defense",
      logistics: "Logistics",
      intelligent_account: "Intelligence",
    }

    await adminSupabase.from("notifications").insert({
      user_id: pilotProfile.user_id,
      type: status === "approved" ? "success" : "error",
      title: `${departmentNames[department]} Review ${status === "approved" ? "Approved" : "Rejected"}`,
      message:
        notes ||
        `Your profile has been ${status} by ${departmentNames[department]}. ${pilotProfile.verification_status === "approved" ? "Your profile is now fully approved!" : pilotProfile.verification_status === "rejected" ? "Your profile has been rejected." : "Awaiting review from other departments."}`,
      entity_type: "pilot_profile",
      entity_id: profile_id,
    })

    await adminSupabase.from("audit_logs").insert({
      user_id: user.id,
      action: status === "approved" ? "approve" : "reject",
      entity_type: "pilot_profile",
      entity_id: profile_id,
      description: `Profile ${status} by ${departmentNames[department]} reviewer`,
      metadata: { status, notes, department, overall_status: pilotProfile.verification_status },
    })

    return NextResponse.json({ success: true, overallStatus: pilotProfile.verification_status })
  } catch (error) {
    console.error("[v0] Profile review API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
