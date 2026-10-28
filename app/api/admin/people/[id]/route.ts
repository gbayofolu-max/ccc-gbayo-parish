import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/roles";

export const runtime = "nodejs";

// True if at least one OTHER admin would still exist after this person stops being an admin.
async function anotherAdminExists(excludeId: string) {
  const { count } = await supabaseAdmin
    .from("admin_users")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .neq("id", excludeId);

  return (count ?? 0) > 0;
}

// Change someone's role or set a new password.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireRole(["admin"]);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await params;
  const body = await req.json();

  const { data: person } = await supabaseAdmin
    .from("admin_users")
    .select("id, role")
    .eq("id", id)
    .maybeSingle();

  if (!person) {
    return NextResponse.json({ error: "Person not found" }, { status: 404 });
  }

  if (typeof body.role === "string") {
    if (body.role !== "admin" && body.role !== "operator") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (id === access.user.id) {
      return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
    }
    if (person.role === "admin" && body.role !== "admin" && !(await anotherAdminExists(id))) {
      return NextResponse.json({ error: "There must always be at least one admin" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("admin_users").update({ role: body.role }).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (typeof body.password === "string") {
    if (body.password.length < 10) {
      return NextResponse.json({ error: "The password must be at least 10 characters" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password: body.password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true });
}

// Remove someone's access: they are taken off the team list and their account is switched off.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireRole(["admin"]);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await params;

  if (id === access.user.id) {
    return NextResponse.json({ error: "You cannot remove your own access" }, { status: 400 });
  }

  const { data: person } = await supabaseAdmin
    .from("admin_users")
    .select("id, role")
    .eq("id", id)
    .maybeSingle();

  if (!person) {
    return NextResponse.json({ error: "Person not found" }, { status: 404 });
  }

  if (person.role === "admin" && !(await anotherAdminExists(id))) {
    return NextResponse.json({ error: "There must always be at least one admin" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("admin_users").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Switch the sign-in itself off too (about 100 years). Adding the person again lifts this.
  await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: "876000h" });

  return NextResponse.json({ success: true });
}
