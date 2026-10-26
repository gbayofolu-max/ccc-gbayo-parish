import { createSupabaseServerClient } from "@/lib/supabase/server-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export type AppRole = "admin" | "operator";

type RoleResult =
  | { ok: true; user: { id: string; email?: string | null }; role: AppRole }
  | { ok: false; status: 401 | 403; error: string };

// Who is signed in, and what is their role? The role is read on the server from
// the admin_users table, never from anything the browser sends.
export async function requireRole(allowed: AppRole[]): Promise<RoleResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const { data: row, error } = await supabaseAdmin
    .from("admin_users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = row?.role === "admin" || row?.role === "operator" ? (row.role as AppRole) : null;

  if (error || !role) {
    return { ok: false, status: 403, error: "No access" };
  }

  if (!allowed.includes(role)) {
    return { ok: false, status: 403, error: "Your role does not allow this" };
  }

  return { ok: true, user: { id: user.id, email: user.email }, role };
}
