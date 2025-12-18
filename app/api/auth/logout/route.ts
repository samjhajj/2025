import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const response = NextResponse.json({ success: true })

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
              response.cookies.set(name, value, options)
            })
          },
        },
      },
    )

    try {
      await supabase.auth.signOut({ scope: "local" })
    } catch (signOutError: any) {
      // Ignore session_not_found errors - the session is already gone which is what we want
      if (signOutError?.code !== "session_not_found" && signOutError?.message !== "Auth session missing!") {
        console.error("[v0] Supabase signOut error:", signOutError)
      }
    }

    // Clear all Supabase auth cookies
    const allCookies = cookieStore.getAll()
    allCookies.forEach((cookie) => {
      if (cookie.name.startsWith("sb-") || cookie.name.includes("auth-token")) {
        response.cookies.delete(cookie.name)
      }
    })

    return response
  } catch (error) {
    console.error("[v0] Logout error:", error)

    // Logout should be idempotent - it should succeed even if session is already gone
    const response = NextResponse.json({ success: true })
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    allCookies.forEach((cookie) => {
      if (cookie.name.startsWith("sb-") || cookie.name.includes("auth-token")) {
        response.cookies.delete(cookie.name)
      }
    })

    return response
  }
}
