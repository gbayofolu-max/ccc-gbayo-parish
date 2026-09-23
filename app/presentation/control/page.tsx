"use client";

import { useState, useMemo } from "react";

type Tab = "verse" | "hymn" | "custom";

interface VerseRow {
  verse: number;
  text: string;
}

interface LookupResult {
  content_type: string;
  title: string | null;
  body_text: string | null;
  reference: string | null;
  language: string | null;
  verses: VerseRow[] | null;
}

const VERSES_PER_PAGE = 3;

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-navy placeholder:text-gray-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

export default function PresentationControlPage() {
  const [tab, setTab] = useState<Tab>("verse");

  const [book, setBook] = useState("");
  const [chapter, setChapter] = useState("");
  const [verseStart, setVerseStart] = useState("");
  const [verseEnd, setVerseEnd] = useState("");
  const [language, setLanguage] = useState<"english" | "yoruba">("english");

  const [hymnNumber, setHymnNumber] = useState("");

  const [customTitle, setCustomTitle] = useState("");
  const [customBody, setCustomBody] = useState("");

  const [result, setResult] = useState<LookupResult | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [shown, setShown] = useState(false);

  const pages: VerseRow[][] = useMemo(() => {
    if (!result?.verses || result.verses.length === 0) return [];
    const chunks: VerseRow[][] = [];
    for (let i = 0; i < result.verses.length; i += VERSES_PER_PAGE) {
      chunks.push(result.verses.slice(i, i + VERSES_PER_PAGE));
    }
    return chunks;
  }, [result]);

  const isPaginated = pages.length > 0;
  const currentPageVerses = isPaginated ? pages[pageIndex] : null;

  function switchTab(next: Tab) {
    setTab(next);
    setResult(null);
    setPageIndex(0);
    setShown(false);
    setStatus("");
  }

  async function pushToScreen(payload: {
    content_type: string;
    title: string | null;
    body_text: string;
    reference: string | null;
    language: string | null;
  }) {
    setStatus("Sending to screen...");
    try {
      const res = await fetch("/api/presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setStatus("Now showing on screen.");
        setShown(true);
      } else {
        setStatus("Failed to update screen.");
      }
    } catch {
      setStatus("Network error — try again.");
    }
  }

  async function handlePreviewVerse() {
    if (!book.trim() || !chapter.trim()) {
      setStatus("Enter at least a book and chapter.");
      return;
    }
    setStatus("Looking up...");
    setShown(false);
    try {
      const res = await fetch("/api/presentation/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "verse", book, chapter, verseStart, verseEnd, language }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Not found");
        setResult(null);
        return;
      }
      setResult(data);
      setPageIndex(0);
      setStatus("");
    } catch {
      setStatus("Network error — try again.");
    }
  }

  async function handlePreviewHymn() {
    if (!hymnNumber.trim()) {
      setStatus("Enter a hymn number.");
      return;
    }
    setStatus("Looking up...");
    setShown(false);
    try {
      const res = await fetch("/api/presentation/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "hymn", number: hymnNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Not found");
        setResult(null);
        return;
      }
      setResult(data);
      setPageIndex(0);
      setStatus("");
    } catch {
      setStatus("Network error — try again.");
    }
  }

  function handleCustomPreview() {
    if (!customBody.trim()) {
      setStatus("Enter a message to show.");
      return;
    }
    setResult({
      content_type: "announcement",
      title: customTitle || null,
      body_text: customBody,
      reference: null,
      language: null,
      verses: null,
    });
    setPageIndex(0);
    setShown(false);
    setStatus("");
  }

  function handleShow() {
    if (!result) return;

    if (isPaginated && currentPageVerses) {
      const pageText = currentPageVerses.map((v) => `${v.verse}. ${v.text}`).join(" ");
      const pageLabel =
        pages.length > 1
          ? `${result.title} (${pageIndex + 1} of ${pages.length})`
          : result.title;
      pushToScreen({
        content_type: "verse",
        title: pageLabel,
        body_text: pageText,
        reference: result.reference,
        language: result.language,
      });
    } else {
      pushToScreen({
        content_type: result.content_type,
        title: result.title,
        body_text: result.body_text ?? "",
        reference: result.reference,
        language: result.language,
      });
    }
  }

  function goToPage(newIndex: number) {
    setPageIndex(newIndex);
    if (shown && result && pages[newIndex]) {
      const pageText = pages[newIndex].map((v) => `${v.verse}. ${v.text}`).join(" ");
      const pageLabel = `${result.title} (${newIndex + 1} of ${pages.length})`;
      pushToScreen({
        content_type: "verse",
        title: pageLabel,
        body_text: pageText,
        reference: result.reference,
        language: result.language,
      });
    }
  }

  async function handleClear() {
    setStatus("Clearing...");
    try {
      const res = await fetch("/api/presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_type: "blank" }),
      });
      if (res.ok) {
        setStatus("Screen cleared.");
        setResult(null);
        setShown(false);
      }
    } catch {
      setStatus("Network error — try again.");
    }
  }

  const tabClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      active ? "bg-navy text-gold" : "bg-white text-navy border border-navy/20"
    }`;

  const previewBodyText = isPaginated && currentPageVerses
    ? currentPageVerses.map((v) => `${v.verse}. ${v.text}`).join(" ")
    : result?.body_text ?? "";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-1 font-serif text-3xl font-bold text-navy">Presentation Control</h1>
        <p className="mb-6 text-sm text-navy-light/70">
          This page controls the projector screen. Keep it on your own device — the congregation
          only ever sees the /presentation screen, never this page.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="mb-6 flex flex-wrap gap-2">
              <button onClick={() => switchTab("verse")} className={tabClass(tab === "verse")}>
                Bible Verse
              </button>
              <button onClick={() => switchTab("hymn")} className={tabClass(tab === "hymn")}>
                Hymn
              </button>
              <button onClick={() => switchTab("custom")} className={tabClass(tab === "custom")}>
                Announcement
              </button>
            </div>

            {tab === "verse" && (
              <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-light/70">
                    Book
                  </label>
                  <input
                    className={inputClass}
                    placeholder="e.g. John, 1 Corinthians, Psalm"
                    value={book}
                    onChange={(e) => setBook(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <div className="w-full">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-light/70">
                      Chapter
                    </label>
                    <input
                      className={inputClass}
                      placeholder="e.g. 3"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                    />
                  </div>
                  <div className="w-full">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-light/70">
                      Verse (optional)
                    </label>
                    <input
                      className={inputClass}
                      placeholder="e.g. 16"
                      value={verseStart}
                      onChange={(e) => setVerseStart(e.target.value)}
                    />
                  </div>
                  <div className="w-full">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-light/70">
                      To Verse (optional)
                    </label>
                    <input
                      className={inputClass}
                      placeholder="e.g. 18"
                      value={verseEnd}
                      onChange={(e) => setVerseEnd(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-navy-light/60">
                  Leave verse fields empty to load the whole chapter — it will be split into
                  {" "}{VERSES_PER_PAGE}-verse pages you can step through with Next/Previous.
                </p>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-light/70">
                    Language
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLanguage("english")}
                      className={`rounded-lg px-3 py-2 text-sm ${
                        language === "english" ? "bg-navy text-gold" : "bg-gray-100 text-navy"
                      }`}
                    >
                      English (KJV)
                    </button>
                    <button
                      onClick={() => setLanguage("yoruba")}
                      className={`rounded-lg px-3 py-2 text-sm ${
                        language === "yoruba" ? "bg-navy text-gold" : "bg-gray-100 text-navy"
                      }`}
                    >
                      Yorùbá
                    </button>
                  </div>
                </div>
                <button
                  onClick={handlePreviewVerse}
                  className="w-full rounded-lg bg-gold px-4 py-2 font-semibold text-navy"
                >
                  Look Up
                </button>
              </div>
            )}

            {tab === "hymn" && (
              <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-light/70">
                    Hymn Number
                  </label>
                  <input
                    className={inputClass}
                    placeholder="e.g. 5"
                    value={hymnNumber}
                    onChange={(e) => setHymnNumber(e.target.value)}
                  />
                </div>
                <button
                  onClick={handlePreviewHymn}
                  className="w-full rounded-lg bg-gold px-4 py-2 font-semibold text-navy"
                >
                  Look Up
                </button>
              </div>
            )}

            {tab === "custom" && (
              <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-light/70">
                    Title
                  </label>
                  <input
                    className={inputClass}
                    placeholder="e.g. Welcome, Offering"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-light/70">
                    Message
                  </label>
                  <textarea
                    className={inputClass}
                    rows={4}
                    placeholder="Message to show on screen"
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleCustomPreview}
                  className="w-full rounded-lg bg-gold px-4 py-2 font-semibold text-navy"
                >
                  Preview
                </button>
              </div>
            )}

            {status && <p className="mt-4 text-sm text-navy-light">{status}</p>}
          </div>

          <div className="md:sticky md:top-6 md:self-start">
            {result ? (
              <div className="rounded-2xl border-2 border-gold bg-navy p-6 text-center">
                {result.title && (
                  <div className="mb-3 font-serif text-xl font-bold text-gold">
                    {result.title}
                    {isPaginated && pages.length > 1 && (
                      <span className="ml-2 text-sm font-normal text-gold/60">
                        ({pageIndex + 1} of {pages.length})
                      </span>
                    )}
                  </div>
                )}
                <div className="font-serif text-lg leading-relaxed text-white">
                  {previewBodyText}
                </div>
                {result.language && (
                  <div className="mt-3 text-xs uppercase tracking-widest text-gold/60">
                    {result.language}
                  </div>
                )}

                {isPaginated && pages.length > 1 && (
                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() => goToPage(Math.max(0, pageIndex - 1))}
                      disabled={pageIndex === 0}
                      className="flex-1 rounded-lg border border-gold/40 px-3 py-2 text-sm font-semibold text-gold disabled:opacity-30"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => goToPage(Math.min(pages.length - 1, pageIndex + 1))}
                      disabled={pageIndex === pages.length - 1}
                      className="flex-1 rounded-lg border border-gold/40 px-3 py-2 text-sm font-semibold text-gold disabled:opacity-30"
                    >
                      Next →
                    </button>
                  </div>
                )}

                <button
                  onClick={handleShow}
                  className="mt-3 w-full rounded-lg bg-gold px-4 py-3 font-semibold text-navy"
                >
                  {shown ? "Update Screen" : "Show on Screen"}
                </button>
              </div>
            ) : (
              <div className="flex min-h-[160px] items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-6 text-center text-sm text-navy-light/50">
                Your preview will appear here after you look something up.
              </div>
            )}

            <button
              onClick={handleClear}
              className="mt-4 w-full rounded-lg border border-red-300 bg-red-50 px-4 py-2 font-semibold text-red-700"
            >
              Clear Screen
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
