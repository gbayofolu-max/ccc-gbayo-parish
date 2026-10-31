import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/roles";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const access = await requireRole(["admin"]);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const days = Number.parseInt(req.nextUrl.searchParams.get("days") ?? "35", 10);
  const safeDays = Number.isInteger(days) ? Math.min(Math.max(days, 1), 730) : 35;

  const { data, error } = await supabaseAdmin.rpc("visits_report", { p_days: safeDays });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ days: safeDays, ...(data ?? { daily: [], sections: [] }) });
}
