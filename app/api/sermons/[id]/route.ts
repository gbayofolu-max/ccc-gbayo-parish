import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: sermon, error: sermonError } = await supabaseAdmin
    .from("sermons")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (sermonError || !sermon) {
    return NextResponse.json({ error: "Sermon not found" }, { status: 404 });
  }

  const { data: posts, error: postsError } = await supabaseAdmin
    .from("sermon_posts")
    .select("*")
    .eq("sermon_id", id)
    .order("day_index", { ascending: true });

  if (postsError) {
    return NextResponse.json({ error: postsError.message }, { status: 500 });
  }

  return NextResponse.json({ sermon, posts: posts || [] });
}
