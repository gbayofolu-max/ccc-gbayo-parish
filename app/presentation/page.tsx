"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

// Text size as a share of the screen width, so every projector shows the same proportions.
function fontSizeVw(fontSize: string | null): number {
  switch (fontSize) {
    case "compact":
      return 3.125;
    case "standard":
      return 3.75;
    case "large":
      return 5;
    case "giant":
      return 6.67;
    case "extra-large":
    default:
      return 5.5;
  }
}

function lineHeightValue(lineSpacing: string | null): number {
  switch (lineSpacing) {
    case "tight":
      return 1.25;
    case "spacious":
      return 2;
    case "normal":
    default:
      return 1.375;
  }
}

export default function PresentationPage() {
  const [state, setState] = useState<PresentationState | null>(null);
  const [realtimeOn, setRealtimeOn] = useState(false);
  const [started, setStarted] = useState(false);
  const [churchName, setChurchName] = useState("CCC Gbayo Parish");
  const textRef = useRef<HTMLDivElement>(null);
  const wakeLock = useRef<any>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/presentation", { cache: "no-store" });
      const data = await res.json();
      if (data && !data.error) setState(data);
    } catch {
      // A projector screen should never show an error: keep what was last displayed and retry quietly.
    }
  }, []);

  // Updates arrive the moment the operator presses Show. A slow check runs as a safety net,
  // and a faster one takes over if the live connection drops.
  useEffect(() => {
    let active = true;
    const supabase = createClient();

    refresh();

    supabase
      .from("church_settings")
      .select("church_name")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }: { data: { church_name?: string } | null }) => {
        if (active && data?.church_name) setChurchName(data.church_name);
      });

    const channel = supabase
      .channel("projector-display")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "presentation_state", filter: "id=eq.1" },
        (payload: any) => {
          if (active && payload.new) setState(payload.new as PresentationState);
        }
      )
      .subscribe((status: string) => {
        if (!active) return;
        const connected = status === "SUBSCRIBED";
        setRealtimeOn(connected);
        if (connected) refresh();
      });

    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", refresh);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", refresh);
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(refresh, realtimeOn ? 30000 : 3000);
    return () => clearInterval(interval);
  }, [realtimeOn, refresh]);

  const acquireWakeLock = useCallback(async () => {
    try {
      wakeLock.current = await (navigator as any).wakeLock?.request("screen");
    } catch {
      // Not supported on this device: the screen may sleep, nothing else is affected.
    }
  }, []);

  useEffect(() => {
    if (!started) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") acquireWakeLock();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [started, acquireWakeLock]);

  async function startDisplay() {
    setStarted(true);
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      // Full screen was refused: the display still works in a normal window.
    }
    acquireWakeLock();
  }

  const isBlank = !state || state.content_type === "blank";
  const basePx = () => (Math.min(window.innerWidth, window.innerHeight * (16 / 9)) * fontSizeVw(state?.font_size ?? null)) / 100;

  // Auto-fit: shrink the text step by step until all of it fits the screen.
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || isBlank) return;

    const apply = () => {
      const base = basePx();
      el.style.fontSize = `${base}px`;
      if (!state?.auto_fit) return;
      const limit = window.innerHeight * (state?.title ? 0.72 : 0.86);
      for (let s = 1; s >= 0.3; s -= 0.05) {
        el.style.fontSize = `${base * s}px`;
        if (el.scrollHeight <= limit) break;
      }
    };

    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isBlank]);

  return (
    <main className={`flex h-screen w-full flex-col overflow-hidden bg-navy px-10 py-8 text-center md:px-20 ${started ? "cursor-none" : ""}`}>
      {isBlank ? (
        <div className="m-auto font-serif text-4xl text-gold/30">{churchName}</div>
      ) : (
        <div className="m-auto flex w-full max-w-[96rem] flex-col items-center">
          {state?.title && (
            <div className="mb-8 font-serif text-4xl font-bold text-gold md:text-5xl">{state.title}</div>
          )}

          {state?.body_text && (
            <div
              ref={textRef}
              className="whitespace-pre-line text-white"
              style={{
                fontFamily: fontFamilyStyle(state.font_family),
                lineHeight: lineHeightValue(state.line_spacing),
                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
              }}
            >
              {state.body_text}
            </div>
          )}

          {state?.language && (
            <div className="mt-10 font-sans text-2xl uppercase tracking-[0.3em] text-gold/70">{state.language}</div>
          )}
        </div>
      )}

      <div
        className="fixed bottom-2 right-2 h-2 w-2 rounded-full"
        style={{ backgroundColor: realtimeOn ? "rgba(34,197,94,0.25)" : "rgba(245,158,11,0.35)" }}
        title={realtimeOn ? "Live" : "Reconnecting"}
      />

      {!started && (
        <button
          onClick={startDisplay}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy/95 px-8 text-center text-white"
        >
          <span className="font-serif text-4xl font-bold text-gold">{churchName}</span>
          <span className="mt-6 text-2xl">Tap anywhere to start the display</span>
          <span className="mt-3 text-base text-white/60">Goes full screen and keeps the screen awake.</span>
        </button>
      )}
    </main>
  );
}
