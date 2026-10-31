import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Only these page groups are counted separately, so the table can never grow beyond a handful of rows a day.
const SECTIONS = new Set([
  "live",
  "history",
  "events",
  "announcements",
  "mother-celestial",
  "contact",
  "sermons",
  "posts",
  "lessons",
  "nehemiah",
  "live-stream",
]);

const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests/i;

function sectionOf(path: string): string | null {
  const clean = path.split("?")[0].split("#")[0].toLowerCase();

  if (clean.startsWith("/admin") || clean.startsWith("/presentation") || clean.startsWith("/api")) {
    return null;
  }

  const first = clean.split("/").filter(Boolean)[0];

  if (!first) return "/";
  if (SECTIONS.has(first)) return `/${first}`;
  return "/other";
}

export async function POST(req: NextRequest) {
  try {
    if (BOTS.test(req.headers.get("user-agent") ?? "")) {
      return new NextResponse(null, { status: 204 });
    }

    const body = await req.json();
    const path = typeof body.path === "string" ? body.path.slice(0, 200) : "";
    const section = sectionOf(path);

    if (!section) {
      return new NextResponse(null, { status: 204 });
    }

    await supabaseAdmin.rpc("record_visit", {
      p_section: section,
      p_visitor: body.visitor === true,
      p_new_ever: body.newEver === true,
      p_mobile: body.mobile === true,
    });
  } catch {
    // Counting is best-effort: never show an error to a visitor.
  }

  return new NextResponse(null, { status: 204 });
}
