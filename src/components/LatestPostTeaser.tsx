import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";

export default async function LatestPostTeaser() {
  const { data: post } = await supabaseAdmin
    .from("sermon_posts")
    .select("title, body, slug")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!post) return null;

  const excerpt = post.body.length > 180 ? post.body.slice(0, 180).trim() + "…" : post.body;

  return (
    <section className="bg-white px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-dark-gold">
          Today's Word
        </p>
        <h2 className="mb-4 font-serif text-3xl font-bold text-navy">{post.title}</h2>
        <p className="mx-auto mb-6 max-w-xl text-navy-light/80">{excerpt}</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href={`/posts/${post.slug}`}
            className="rounded-full bg-gold px-6 py-2.5 font-semibold text-navy shadow-glow transition-transform hover:scale-105"
          >
            Read More
          </Link>
          <Link href="/posts" className="text-sm font-semibold text-navy-light hover:text-gold">
            View All Posts →
          </Link>
        </div>
      </div>
    </section>
  );
}
