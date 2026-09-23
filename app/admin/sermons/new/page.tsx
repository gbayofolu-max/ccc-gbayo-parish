"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type InputMode = "paste" | "pdf";

export default function NewSermonPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [preachedOn, setPreachedOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [slidesUrl, setSlidesUrl] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [fullText, setFullText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [status, setStatus] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setStatus("Title is required.");
      return;
    }
    if (inputMode === "paste" && !fullText.trim()) {
      setStatus("Paste the sermon text, or switch to PDF upload.");
      return;
    }
    if (inputMode === "pdf" && !pdfFile) {
      setStatus("Choose a PDF file, or switch to pasting text.");
      return;
    }

    setSubmitting(true);
    setStatus("Uploading and processing — this can take a minute or two (embedding text, generating drafts)...");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("preached_on", preachedOn);
    if (slidesUrl.trim()) formData.append("slides_url", slidesUrl.trim());

    if (inputMode === "paste") {
      formData.append("full_text", fullText);
    } else if (pdfFile) {
      formData.append("pdf", pdfFile);
    }

    try {
      const res = await fetch("/api/sermons", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus(`Error: ${data.error || "Something went wrong."}`);
        setSubmitting(false);
        return;
      }

      setStatus(`Success — ${data.postsGenerated} draft post(s) generated. Redirecting to review...`);
      router.push(`/admin/sermons/${data.sermonId}/review`);
    } catch (err) {
      setStatus("Network error — please try again.");
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-navy placeholder:text-gray-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-1 font-serif text-3xl font-bold text-navy">Upload a Sermon</h1>
        <p className="mb-6 text-sm text-navy-light/70">
          Nehemiah will read this sermon and draft a set of daily posts for you to review before
          anything goes live. The text also becomes searchable in the Nehemiah chat.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-light/70">
              Sermon Title
            </label>
            <input
              className={inputClass}
              placeholder="e.g. Walking in Faith"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-light/70">
              Date Preached
            </label>
            <input
              type="date"
              className={inputClass}
              value={preachedOn}
              onChange={(e) => setPreachedOn(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-light/70">
              Google Slides Link (optional)
            </label>
            <input
              className={inputClass}
              placeholder="https://docs.google.com/presentation/..."
              value={slidesUrl}
              onChange={(e) => setSlidesUrl(e.target.value)}
            />
            <p className="mt-1 text-xs text-navy-light/50">
              Use Google Slides' "Publish to web" link. This feeds the presentation screen, not
              the text below.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-light/70">
              Sermon Text
            </label>
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => setInputMode("paste")}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                  inputMode === "paste" ? "bg-navy text-gold" : "bg-gray-100 text-navy"
                }`}
              >
                Paste Text
              </button>
              <button
                type="button"
                onClick={() => setInputMode("pdf")}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                  inputMode === "pdf" ? "bg-navy text-gold" : "bg-gray-100 text-navy"
                }`}
              >
                Upload PDF
              </button>
            </div>

            {inputMode === "paste" ? (
              <textarea
                className={inputClass}
                rows={10}
                placeholder="Paste the full sermon text here..."
                value={fullText}
                onChange={(e) => setFullText(e.target.value)}
              />
            ) : (
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-navy"
              />
            )}
          </div>

          {status && <p className="text-sm text-navy-light">{status}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gold px-4 py-3 font-semibold text-navy disabled:opacity-60"
          >
            {submitting ? "Processing..." : "Generate Daily Posts"}
          </button>
        </form>
      </div>
    </main>
  );
}
