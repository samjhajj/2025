import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { amount } = body

    // For now, create a mock payment record
    // In production, this would integrate with Stripe
    const { error: paymentError } = await supabase.from("payments").insert({
      user_id: user.id,
      amount,
      currency: "USD",
      status: "completed",
      payment_provider: "mock",
      description: "Pilot registration fee",
      paid_at: new Date().toISOString(),
    })

    if (paymentError) {
      console.error("[v0] Payment creation error:", paymentError)
      return NextResponse.json({ error: paymentError.message }, { status: 500 })
    }

    // Create notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "payment_received",
      title: "Payment Received",
      message: "Your registration fee of $25.00 has been received. Your profile is now under review.",
    })

    // Create audit log
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "payment_made",
      entity_type: "payment",
      entity_id: user.id,
      description: `Payment of $${amount} USD completed`,
      metadata: { amount, currency: "USD" },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Payment API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
