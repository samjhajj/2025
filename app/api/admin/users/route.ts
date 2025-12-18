import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    const { user_id, role } = body

    // Update user role
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user_id)

    if (updateError) {
      console.error("[v0] User update error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Create audit log
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "user_role_updated",
      entity_type: "profile",
      entity_id: user_id,
      description: `User role updated to ${role}`,
      metadata: { new_role: role },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Admin users API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
