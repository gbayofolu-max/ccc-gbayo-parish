import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import ShareButton from "@/components/ShareButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: post } = await supabaseAdmin
    .from("sermon_posts")
    .select("title, body")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!post) return { title: "Post Not Found – CCC Gbayo Parish" };

  return {
    title: `${post.title} – CCC Gbayo Parish`,
    description: post.body.slice(0, 160),
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: post } = await supabaseAdmin
    .from("sermon_posts")
    .select("title, body, published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!post) notFound();

  const dateLabel = new Date(post.published_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ccc-gbayo-parish-li6x.vercel.app";
  const postUrl = `${siteUrl}/posts/${slug}`;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <article className="mx-auto max-w-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-dark-gold">
          {dateLabel}
        </p>
        <h1 className="mb-6 font-serif text-3xl font-bold text-navy md:text-4xl">{post.title}</h1>
        <div className="mb-10 whitespace-pre-wrap text-lg leading-relaxed text-navy-light/90">
          {post.body}
        </div>
        <ShareButton title={post.title} url={postUrl} />
      </article>
    </main>
  );
}
