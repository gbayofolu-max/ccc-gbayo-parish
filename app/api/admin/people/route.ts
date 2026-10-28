import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/roles";

export const runtime = "nodejs";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function GET() {
  const access = await requireRole(["admin"]);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { data: rows, error } = await supabaseAdmin
    .from("admin_users")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const lastSeen = new Map<string, string | null>(
    (list?.users ?? []).map((u: any) => [u.id as string, (u.last_sign_in_at as string | null) ?? null])
  );

  return NextResponse.json({
    me: access.user.id,
    people: (rows ?? []).map((r: any) => ({ ...r, last_sign_in_at: lastSeen.get(r.id) ?? null })),
  });
}

// Add a person who can sign in. The admin chooses their first password and passes it on privately.
export async function POST(req: NextRequest) {
  const access = await requireRole(["admin"]);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await req.json();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body.role === "admin" || body.role === "operator" ? body.role : null;
  const password = typeof body.password === "string" ? body.password : "";

  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (!role) {
    return NextResponse.json({ error: "Choose a role: admin or operator" }, { status: 400 });
  }
  if (password.length < 10) {
    return NextResponse.json({ error: "The password must be at least 10 characters" }, { status: 400 });
  }

  let userId: string | null = null;

  const created = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });

  if (created.error) {
    // The account may already exist (for example someone who was removed earlier): reuse it.
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = (list?.users ?? []).find((u: any) => (u.email ?? "").toLowerCase() === email);

    if (!existing) {
      return NextResponse.json({ error: created.error.message }, { status: 400 });
    }

    userId = existing.id as string;
    const reset = await supabaseAdmin.auth.admin.updateUserById(userId, { password, ban_duration: "none" });
    if (reset.error) {
      return NextResponse.json({ error: reset.error.message }, { status: 400 });
    }
  } else {
    userId = created.data.user?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: "Could not create the account" }, { status: 500 });
  }

  const { error } = await supabaseAdmin
    .from("admin_users")
    .upsert({ id: userId, email, role }, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: userId, email, role });
}
