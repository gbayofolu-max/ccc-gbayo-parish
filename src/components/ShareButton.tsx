"use client";

import { useState } from "react";

export default function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const nav = navigator as any;

    if (nav && typeof nav.share === "function") {
      try {
        await nav.share({ title, url });
      } catch {
        // Person cancelled the native share sheet — nothing to do.
      }
      return;
    }

    try {
      await nav.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access failed — silently ignore rather than error out.
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-navy shadow-glow transition-transform hover:scale-105"
    >
      {copied ? "Link Copied!" : "Share"}
    </button>
  );
}
