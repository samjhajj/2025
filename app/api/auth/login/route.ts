import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      return NextResponse.json({ error: signInError.message }, { status: 401 })
    }

    if (!signInData.session) {
      return NextResponse.json({ error: "No session created" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", signInData.user.id).maybeSingle()

    let userRole = profile?.role || "pilot"

    if (!profile) {
      console.log("[v0] Profile not found, creating one for user:", signInData.user.id)

      // Get role from user metadata or default to pilot
      const metadataRole = signInData.user.user_metadata?.role as string | undefined
      userRole = metadataRole || "pilot"

      const adminClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll() {
              return []
            },
            setAll() {
              // Admin client doesn't need to set cookies
            },
          },
        },
      )

      const { data: insertedProfile, error: insertError } = await adminClient
        .from("profiles")
        .insert({
          id: signInData.user.id,
          email: signInData.user.email,
          role: userRole,
        })
        .select()
        .single()

      if (insertError) {
        console.error("[v0] Database error saving new user profile:", insertError)
        return NextResponse.json(
          { error: "Database error saving new user", details: insertError.message },
          { status: 500 },
        )
      } else {
        console.log("[v0] Profile created successfully:", insertedProfile)
      }
    }

    return NextResponse.json({
      user: signInData.user,
      role: userRole,
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
