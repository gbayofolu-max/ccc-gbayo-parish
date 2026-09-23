import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";

export const metadata = {
  title: "Daily Word – CCC Gbayo Parish",
  description: "Daily devotional posts from CCC Gbayo Parish, drawn from recent sermons.",
};

export default async function PostsPage() {
  const { data: posts } = await supabaseAdmin
    .from("sermon_posts")
    .select("title, body, slug, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-r from-navy via-navy-mid to-navy py-20 text-center">
        <h1 className="font-serif text-4xl font-bold text-gold md:text-5xl">Daily Word</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
          Short reflections drawn from our recent sermons, shared throughout the week.
        </p>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-16">
        {!posts || posts.length === 0 ? (
          <p className="text-center text-navy-light/60">
            Nothing published yet — check back soon.
          </p>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => {
              const excerpt =
                post.body.length > 220 ? post.body.slice(0, 220).trim() + "…" : post.body;
              const dateLabel = new Date(post.published_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });
              return (
                <Link
                  key={post.slug}
                  href={`/posts/${post.slug}`}
                  className="block rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dark-gold">
                    {dateLabel}
                  </p>
                  <h2 className="mb-2 font-serif text-xl font-bold text-navy">{post.title}</h2>
                  <p className="text-sm text-navy-light/80">{excerpt}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
