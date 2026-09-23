"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Props {
  title: string;
  body: string;
  slug: string;
}

export default function TodaysWordPopupClient({ title, body, slug }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    let lastSeen: string | null = null;
    try {
      lastSeen = window.localStorage.getItem("todaysWordSeenDate");
    } catch {
      // localStorage unavailable (private browsing, etc.) — just show it once, harmless
    }

    if (lastSeen !== todayKey) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  function dismiss() {
    const todayKey = new Date().toISOString().slice(0, 10);
    try {
      window.localStorage.setItem("todaysWordSeenDate", todayKey);
    } catch {
      // ignore if storage isn't available
    }
    setVisible(false);
  }

  if (!visible) return null;

  const excerpt = body.length > 140 ? body.slice(0, 140).trim() + "…" : body;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/70 px-6 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-gold/30 bg-navy p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-4 top-4 text-white/60 hover:text-white"
        >
          ✕
        </button>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-dark-gold">
          Today's Word
        </p>
        <h3 className="mb-3 font-serif text-2xl font-bold text-gold">{title}</h3>
        <p className="mb-6 text-sm text-white/80">{excerpt}</p>
        <Link
          href={`/posts/${slug}`}
          onClick={dismiss}
          className="inline-block rounded-full bg-gold px-6 py-2.5 font-semibold text-navy shadow-glow transition-transform hover:scale-105"
        >
          Read Today's Word
        </Link>
      </div>
    </div>
  );
}
