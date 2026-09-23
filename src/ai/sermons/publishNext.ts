import { supabaseAdmin } from "@/lib/supabase/server";
import { embedSinglePost } from "@/ai/sermons/embedSermon";

export interface PublishResult {
  published: boolean;
  reason?: string;
  postId?: number;
  title?: string;
}

export async function publishNextQueuedPost(): Promise<PublishResult> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data: alreadyToday } = await supabaseAdmin
    .from("sermon_posts")
    .select("id")
    .eq("status", "published")
    .gte("published_at", todayStart.toISOString())
    .maybeSingle();

  if (alreadyToday) {
    return { published: false, reason: "A post was already published today." };
  }

  const { data: nextPost, error } = await supabaseAdmin
    .from("sermon_posts")
    .select("id, sermon_id, title, body")
    .eq("status", "approved")
    .order("approved_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { published: false, reason: `Query error: ${error.message}` };
  }

  if (!nextPost) {
    return { published: false, reason: "No approved posts waiting in the queue." };
  }

  const { error: updateError } = await supabaseAdmin
    .from("sermon_posts")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", nextPost.id);

  if (updateError) {
    return { published: false, reason: `Failed to mark published: ${updateError.message}` };
  }

  try {
    await embedSinglePost(nextPost.id, nextPost.sermon_id, nextPost.title, nextPost.body);
  } catch (embedError) {
    console.warn("Post published, but embedding for search failed:", embedError);
  }

  return { published: true, postId: nextPost.id, title: nextPost.title };
}
