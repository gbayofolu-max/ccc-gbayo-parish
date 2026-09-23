import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, any> = {};

  if (typeof body.title === "string") updates.title = body.title;
  if (typeof body.body === "string") updates.body = body.body;

  if (body.action === "approve") {
    updates.status = "approved";
    updates.approved_at = new Date().toISOString();
  } else if (body.action === "discard") {
    updates.status = "discarded";
  } else if (body.action === "revert_to_draft") {
    updates.status = "draft";
    updates.approved_at = null;
  }

  const { data, error } = await supabaseAdmin
    .from("sermon_posts")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
