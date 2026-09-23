import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Session-aware Supabase client for Server Components and Route
// Handlers — this respects the currently logged-in user (via cookies),
// unlike supabaseAdmin (src/lib/supabase/server.ts), which uses the
// service role key and bypasses auth/RLS entirely. Use this one for
// "is this person logged in, and what's their role" checks; keep using
// supabaseAdmin for the AI pipeline's own data access as before.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component that can't set cookies directly —
            // safe to ignore since middleware handles refreshing the session.
          }
        },
      },
    }
  );
}
