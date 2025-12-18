import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await getSupabaseServerClient()
    const { action, notes } = await request.json()

    console.log("[v0] Document verification request:", { documentId: params.id, action, notes })

    // Get current user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get reviewer profile
    const { data: reviewerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !reviewerProfile) {
      console.error("[v0] Reviewer profile error:", profileError)
      return NextResponse.json({ error: "Reviewer profile not found" }, { status: 404 })
    }

    // Verify reviewer has appropriate role
    if (!["admin", "air_defense", "logistics", "intelligence"].includes(reviewerProfile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get the document
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", params.id)
      .single()

    if (docError || !document) {
      console.error("[v0] Document not found:", docError)
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Update document status
    const newStatus = action === "verify" ? "verified" : "rejected"
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        scan_status: newStatus,
        scan_date: new Date().toISOString(),
        description: notes || null,
      })
      .eq("id", params.id)

    if (updateError) {
      console.error("[v0] Error updating document:", updateError)
      return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
    }

    // Create audit log
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "document_uploaded", // Using existing enum value
      entity_type: "document",
      entity_id: params.id,
      description: `Document ${action === "verify" ? "verified" : "rejected"} by ${reviewerProfile.role}${notes ? `: ${notes}` : ""}`,
      metadata: {
        document_type: document.document_type,
        action: action,
        reviewer_role: reviewerProfile.role,
        notes: notes,
      },
    })

    const adminSupabase = getSupabaseAdminClient()

    const { error: notificationError } = await adminSupabase.from("notifications").insert({
      user_id: document.user_id,
      type: "system_alert",
      title: `Document ${action === "verify" ? "Verified" : "Rejected"}`,
      message: `Your ${document.document_type.replace("_", " ")} document has been ${action === "verify" ? "verified" : "rejected"}${notes ? `: ${notes}` : ""}`,
      entity_type: "document",
      entity_id: params.id,
    })

    if (notificationError) {
      console.error("[v0] Error creating notification:", notificationError)
      // Don't fail the whole request if notification fails
    }

    console.log("[v0] Document verification successful:", { documentId: params.id, newStatus })

    return NextResponse.json({
      success: true,
      status: newStatus,
    })
  } catch (error) {
    console.error("[v0] Document verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
