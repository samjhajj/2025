import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Creates a Supabase client for server-side use with proper cookie handling.
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using it.
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}

/**
 * Gets the current user from Supabase with graceful error handling.
 * Returns null if the session is invalid or expired instead of throwing an error.
 * This prevents "session_not_found" errors from crashing the app.
 */
export async function getCurrentUser() {
  try {
    const supabase = await getSupabaseServerClient()

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      // No session or session error - this is normal for logged out users
      return { user: null, error: null }
    }

    const { data, error } = await supabase.auth.getUser()

    // Handle session_not_found errors gracefully (these are expected when sessions expire)
    if (error) {
      if (
        error.message?.includes("session_not_found") ||
        error.message?.includes("Session from session_id claim in JWT does not exist") ||
        error.message?.includes("Auth session missing")
      ) {
        // Silently return null for expired/missing sessions - this is expected behavior
        return { user: null, error: null }
      }
      // Only log unexpected auth errors
      console.error("[v0] Error getting user:", error)
      return { user: null, error }
    }

    return { user: data.user, error: null }
  } catch (err: any) {
    if (
      err?.message?.includes("session_not_found") ||
      err?.message?.includes("Session from session_id claim in JWT does not exist") ||
      err?.status === 403
    ) {
      // Silently handle expired sessions
      return { user: null, error: null }
    }
    console.error("[v0] Unexpected error in getCurrentUser:", err)
    return { user: null, error: err }
  }
}

/**
 * Creates a Supabase client with service role privileges.
 * This bypasses Row Level Security (RLS) and should ONLY be used
 * in server-side code after verifying the user is an admin.
 */
export function getSupabaseAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
