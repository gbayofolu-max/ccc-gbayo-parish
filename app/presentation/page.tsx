"use client";

import { useEffect, useState } from "react";

interface PresentationState {
  content_type: string;
  title: string | null;
  body_text: string | null;
  reference: string | null;
  language: string | null;
}

// Longer passages need a smaller (but still large) font so they fit
// without shrinking into illegibility; short verses get the full
// large size. Thresholds are on character count of the body text.
function fontSizeClassFor(text: string | null): string {
  const len = text?.length ?? 0;
  if (len > 700) return "text-3xl md:text-4xl";
  if (len > 400) return "text-4xl md:text-5xl";
  return "text-5xl md:text-6xl";
}

export default function PresentationPage() {
  const [state, setState] = useState<PresentationState | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch("/api/presentation", { cache: "no-store" });
        const data = await res.json();
        if (active) setState(data);
      } catch {
        // A projector screen should never show an error — just keep
        // whatever was last displayed and quietly retry.
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const isBlank = !state || state.content_type === "blank";
  const fontSizeClass = fontSizeClassFor(state?.body_text ?? null);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-navy px-10 py-10 text-center md:px-20">
      {isBlank ? (
        <div className="font-serif text-4xl text-gold/30">CCC Gbayo Parish</div>
      ) : (
        <div className="flex w-full max-w-6xl flex-col items-center">
          {state?.title && (
            <div className="mb-10 font-serif text-4xl font-bold text-gold md:text-5xl">
              {state.title}
            </div>
          )}

          {state?.body_text && (
            <div
              className={`font-serif ${fontSizeClass} leading-snug text-white`}
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
            >
              {state.body_text}
            </div>
          )}

          {state?.language && (
            <div className="mt-12 font-sans text-2xl uppercase tracking-[0.3em] text-gold/70">
              {state.language}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
