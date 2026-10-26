import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/roles";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("presentation_state")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  // Only a signed-in admin or operator may change what is on the projector.
  const access = await requireRole(["admin", "operator"]);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await req.json();

  const {
    content_type = "blank",
    title = null,
    body_text = null,
    reference = null,
    language = null,
    font_family = "classic",
    font_size = "extra-large",
    line_spacing = "normal",
    auto_fit = false,
  } = body;

  const { data, error } = await supabaseAdmin
    .from("presentation_state")
    .update({
      content_type,
      title,
      body_text,
      reference,
      language,
      font_family,
      font_size,
      line_spacing,
      auto_fit,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
