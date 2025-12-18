import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookies) => {
            cookies.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get pilot profile
    const { data: pilotProfile, error: profileError } = await supabase
      .from("pilot_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (profileError || !pilotProfile) {
      return NextResponse.json({ error: "Pilot profile not found" }, { status: 404 })
    }

    const { data, error } = await supabase.rpc("start_flight", {
      flight_uuid: params.id,
      pilot_profile_uuid: pilotProfile.id,
    })

    if (error) {
      console.error("[v0] Start flight error:", error)
      return NextResponse.json({ error: error.message || "Failed to start flight" }, { status: 400 })
    }

    // Create audit log
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "update",
      entity_type: "flight",
      entity_id: params.id,
      description: "Flight started",
    })

    return NextResponse.json({ success: true, flight: data })
  } catch (error) {
    console.error("[v0] Start flight error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
