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
    const { address, city, country, postalCode, fullName, phone } = body

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email!,
      role: "pilot",
    })

    if (profileError) {
      console.error("[v0] Profile upsert error:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    const { error: pilotError } = await supabase.from("pilot_profiles").insert({
      user_id: user.id,
      full_name: fullName,
      phone: phone || null,
      address: address || null,
      city: city || null,
      country: country || null,
      postal_code: postalCode || null,
      verification_status: "pending",
    })

    if (pilotError) {
      console.error("[v0] Pilot profile creation error:", pilotError)
      return NextResponse.json({ error: pilotError.message }, { status: 500 })
    }

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "create",
      entity_type: "pilot_profile",
      entity_id: user.id,
      description: `Pilot profile created`,
      metadata: { city, country, postal_code: postalCode },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Profile API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
