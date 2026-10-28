import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/roles";

export const runtime = "nodejs";

const FIELDS = ["church_name", "service_time", "address", "phone", "email", "extra_note"] as const;
const MAX_LENGTH: Record<(typeof FIELDS)[number], number> = {
  church_name: 120,
  service_time: 120,
  address: 300,
  phone: 60,
  email: 120,
  extra_note: 500,
};

export async function GET() {
  const access = await requireRole(["admin"]);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { data: settings, error } = await supabaseAdmin
    .from("church_settings")
    .select("church_name, service_time, address, phone, email, extra_note, updated_at, updated_by")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Database size, so the team can see how close the free plan limit is.
  const { data: usage } = await supabaseAdmin.rpc("db_usage");

  return NextResponse.json({ settings, usage: usage ?? null });
}

export async function PUT(req: NextRequest) {
  const access = await requireRole(["admin"]);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await req.json();
  const update: Record<string, string> = {};

  for (const field of FIELDS) {
    const value = typeof body[field] === "string" ? body[field].trim() : "";

    if (value.length > MAX_LENGTH[field]) {
      return NextResponse.json({ error: `${field} is too long` }, { status: 400 });
    }

    update[field] = value;
  }

  if (!update.church_name || !update.service_time || !update.address) {
    return NextResponse.json(
      { error: "Church name, service time and address cannot be empty" },
      { status: 400 }
    );
  }

  if (update.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(update.email)) {
    return NextResponse.json({ error: "That email address does not look right" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("church_settings")
    .update({ ...update, updated_at: new Date().toISOString(), updated_by: access.user.email ?? null })
    .eq("id", 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
