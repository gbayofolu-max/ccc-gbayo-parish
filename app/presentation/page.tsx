"use client";

import { useEffect, useState } from "react";

interface PresentationState {
  content_type: string;
  title: string | null;
  body_text: string | null;
  reference: string | null;
  language: string | null;
  font_family: string | null;
  font_size: string | null;
  line_spacing: string | null;
  auto_fit: boolean | null;
}

function fontFamilyStyle(fontFamily: string | null): string {
  switch (fontFamily) {
    case "modern":
      return "Arial, Helvetica, sans-serif";
    case "humanist":
      return '"Trebuchet MS", Arial, sans-serif';
    case "readable":
      return "Verdana, Geneva, sans-serif";
    case "classic":
    default:
      return 'Georgia, "Times New Roman", serif';
  }
}

function fontSizeClass(fontSize: string | null): string {
  switch (fontSize) {
    case "compact":
      return "text-4xl md:text-5xl lg:text-6xl";
    case "standard":
      return "text-5xl md:text-6xl lg:text-7xl";
    case "large":
      return "text-5xl md:text-7xl lg:text-8xl";
    case "giant":
      return "text-6xl md:text-8xl lg:text-9xl";
    case "extra-large":
    default:
      return "text-5xl md:text-6xl lg:text-8xl";
  }
}

function lineSpacingClass(lineSpacing: string | null): string {
  switch (lineSpacing) {
    case "tight":
      return "leading-tight";
    case "spacious":
      return "leading-loose";
    case "normal":
    default:
      return "leading-snug";
  }
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
  const fontFamily = fontFamilyStyle(state?.font_family ?? "classic");
  const fontSize = fontSizeClass(state?.font_size ?? "extra-large");
  const lineSpacing = lineSpacingClass(state?.line_spacing ?? "normal");

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
              className={`${fontSize} ${lineSpacing} text-white`}
              style={{
                fontFamily,
                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
              }}
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
