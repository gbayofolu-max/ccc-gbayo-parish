"use client";

import { useEffect, useState, use as usePromise } from "react";

interface SermonPost {
  id: number;
  day_index: number;
  title: string;
  body: string;
  status: string;
}

interface Sermon {
  id: number;
  title: string;
  preached_on: string;
  status: string;
}

export default function ReviewSermonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = usePromise(params);

  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [posts, setPosts] = useState<SermonPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/sermons/${id}`);
    const data = await res.json();
    if (res.ok) {
      setSermon(data.sermon);
      setPosts(data.posts);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function startEdit(post: SermonPost) {
    setEditingId(post.id);
    setEditTitle(post.title);
    setEditBody(post.body);
  }

  async function saveEdit(postId: number) {
    setBusyId(postId);
    await fetch(`/api/sermons/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, body: editBody }),
    });
    setEditingId(null);
    setBusyId(null);
    load();
  }

  async function handleAction(postId: number, action: "approve" | "discard" | "revert_to_draft") {
    setBusyId(postId);
    await fetch(`/api/sermons/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusyId(null);
    load();
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-600",
      approved: "bg-green-100 text-green-700",
      published: "bg-blue-100 text-blue-700",
      discarded: "bg-red-100 text-red-600",
    };
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] || ""}`}>
        {status}
      </span>
    );
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <p className="text-navy-light">Loading...</p>
      </main>
    );
  }

  if (!sermon) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <p className="text-red-600">Sermon not found.</p>
      </main>
    );
  }

  const approvedCount = posts.filter((p) => p.status === "approved" || p.status === "published").length;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-1 font-serif text-3xl font-bold text-navy">{sermon.title}</h1>
        <p className="mb-8 text-sm text-navy-light/70">
          Preached {sermon.preached_on} &middot; {approvedCount} of {posts.length} approved
        </p>

        <div className="space-y-5">
          {posts.map((post) => (
            <div key={post.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-navy-light/60">
                  Day {post.day_index}
                </span>
                {statusBadge(post.status)}
              </div>

              {editingId === post.id ? (
                <div className="space-y-3">
                  <input
                    className={inputClass}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <textarea
                    className={inputClass}
                    rows={6}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(post.id)}
                      disabled={busyId === post.id}
                      className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-navy"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="mb-2 font-serif text-lg font-bold text-navy">{post.title}</h2>
                  <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-navy-light/90">
                    {post.body}
                  </p>

                  {post.status === "draft" && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleAction(post.id, "approve")}
                        disabled={busyId === post.id}
                        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy disabled:opacity-60"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => startEdit(post)}
                        className="rounded-lg border border-navy/20 px-4 py-2 text-sm font-semibold text-navy"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleAction(post.id, "discard")}
                        disabled={busyId === post.id}
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
                      >
                        Discard
                      </button>
                    </div>
                  )}

                  {post.status === "approved" && (
                    <button
                      onClick={() => handleAction(post.id, "revert_to_draft")}
                      disabled={busyId === post.id}
                      className="rounded-lg border border-navy/20 px-4 py-2 text-sm font-semibold text-navy disabled:opacity-60"
                    >
                      Move back to draft
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
