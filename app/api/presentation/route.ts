import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

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
  const body = await req.json();

  const {
    content_type = "blank",
    title = null,
    body_text = null,
    reference = null,
    language = null,
  } = body;

  const { data, error } = await supabaseAdmin
    .from("presentation_state")
    .update({
      content_type,
      title,
      body_text,
      reference,
      language,
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
