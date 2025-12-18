import { NextResponse } from "next/server"
import { getSupabaseServerClient, getSupabaseAdminClient, getCurrentUser } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()
    const adminSupabase = await getSupabaseAdminClient()
    const { user, error: userError } = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    const mapRole = (role: string) => {
      const roleMap: Record<string, string> = {
        intelligence: "intelligent_account",
        // Keep other roles as-is
      }
      return roleMap[role] || role
    }

    // If profile doesn't exist, create it with default role from user metadata
    if (!profile) {
      const rawRole = user.user_metadata?.role || "pilot"
      const role = mapRole(rawRole)

      const { data: newProfile, error: insertError } = await adminSupabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          role: role,
        })
        .select("role")
        .single()

      if (insertError) {
        console.error("[v0] Error creating profile:", insertError)
        return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
      }

      // Use the newly created profile
      const profileData = newProfile || { role }

      // Check if this is a reviewer or admin role
      if (["air_defense", "logistics", "intelligent_account"].includes(profileData.role)) {
        return NextResponse.json({ redirect: "/review" })
      }

      if (profileData.role === "admin") {
        return NextResponse.json({ redirect: "/admin" })
      }

      // For new pilot users, return empty dashboard data
      return NextResponse.json({
        user,
        profile: profileData,
        pilotProfile: null,
        flights: [],
        drones: [],
        notifications: [],
      })
    }

    // Profile exists, continue with normal flow
    const role = mapRole(profile.role)

    if (["air_defense", "logistics", "intelligent_account"].includes(role)) {
      return NextResponse.json({ redirect: "/review" })
    }

    if (role === "admin") {
      return NextResponse.json({ redirect: "/admin" })
    }

    const { data: pilotProfile } = await supabase
      .from("pilot_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!pilotProfile) {
      return NextResponse.json({
        user,
        profile: { role },
        pilotProfile: null,
        flights: [],
        drones: [],
        notifications: [],
      })
    }

    const { data: flights } = await supabase
      .from("flights")
      .select("*")
      .eq("pilot_id", pilotProfile.id)
      .order("created_at", { ascending: false })
      .limit(5)

    const { data: drones } = await supabase
      .from("drones")
      .select("*")
      .eq("pilot_id", pilotProfile.id)
      .order("created_at", { ascending: false })

    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(5)

    return NextResponse.json({
      user,
      profile: { role },
      pilotProfile,
      flights: flights || [],
      drones: drones || [],
      notifications: notifications || [],
    })
  } catch (error) {
    console.error("[v0] Dashboard API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
