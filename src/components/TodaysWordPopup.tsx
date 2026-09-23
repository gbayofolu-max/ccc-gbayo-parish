import { supabaseAdmin } from "@/lib/supabase/server";
import TodaysWordPopupClient from "./TodaysWordPopupClient";

export default async function TodaysWordPopup() {
  const { data: post } = await supabaseAdmin
    .from("sermon_posts")
    .select("title, body, slug")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!post) return null;

  return <TodaysWordPopupClient title={post.title} body={post.body} slug={post.slug} />;
}
