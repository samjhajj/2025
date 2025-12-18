import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get profile with role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("[v0] Profile fetch error:", profileError)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // If pilot, get pilot profile and drones
    if (profile.role === "pilot") {
      const { data: pilotProfile } = await supabase.from("pilot_profiles").select("*").eq("user_id", user.id).single()

      const { data: drones } = await supabase.from("drones").select("*").eq("pilot_id", pilotProfile?.id)

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
        },
        profile,
        pilotProfile,
        drones: drones || [],
      })
    }

    // For reviewers, return profile only
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
    })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
