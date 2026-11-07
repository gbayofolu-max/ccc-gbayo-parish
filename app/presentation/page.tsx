"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createClient } from "@/lib/supabase/client";
import { buildLines, textKey } from "@/lib/voice/readAlong";

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
  const [pos, setPos] = useState(-1); // word the preacher has just read (-1: following has not started)
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Record<number, HTMLElement | null>>({});
  const wakeLock = useRef<any>(null);

  const isBlank = !state || state.content_type === "blank";
  const body = state?.body_text ?? "";
  const numbered = state?.content_type === "verse";
  const parsed = useMemo(() => buildLines(body, numbered), [body, numbered]);
  const key = useMemo(() => textKey(body) + (numbered ? "n" : ""), [body, numbered]);
  const keyRef = useRef(key);
  keyRef.current = key;

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

  const scrollToWord = useCallback((index: number, jump: boolean) => {
    const box = boxRef.current;
    const word = wordRefs.current[index];
    const text = textRef.current;
    if (!box || !word || !text) return;

    const lineHeight = parseFloat(getComputedStyle(text).lineHeight) || 60;
    const y = word.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    // Keep one line that has been read above the current line, and the unread lines below it.
    const desired = Math.max(0, y - lineHeight * 1.1);

    if (jump || Math.abs(desired - box.scrollTop) > lineHeight * 0.6) {
      box.scrollTo({ top: desired, behavior: jump ? "auto" : "smooth" });
    }
  }, []);

  // Reading position, and manual scroll buttons, from the control page. Live channel only: nothing is stored.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("projector-sync")
      .on("broadcast", { event: "pos" }, ({ payload }: any) => {
        if (!payload || payload.key !== keyRef.current || typeof payload.i !== "number") return;
        setPos(payload.i);
        requestAnimationFrame(() => scrollToWord(payload.i, !!payload.jump));
      })
      .on("broadcast", { event: "scrollBy" }, ({ payload }: any) => {
        const box = boxRef.current;
        if (!box) return;
        const share = payload?.amount === "small" ? 0.2 : payload?.amount === "large" ? 0.9 : 0.5;
        box.scrollBy({ top: (payload?.dir === -1 ? -1 : 1) * box.clientHeight * share, behavior: "smooth" });
      })
      .on("broadcast", { event: "scrollTo" }, ({ payload }: any) => {
        const box = boxRef.current;
        if (!box) return;
        box.scrollTo({ top: payload?.to === "bottom" ? box.scrollHeight : 0, behavior: "smooth" });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [scrollToWord]);

  // A new passage starts from the top with nothing marked as read.
  useEffect(() => {
    setPos(-1);
    boxRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [key]);

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

  const basePx = () => (Math.min(window.innerWidth, window.innerHeight * (16 / 9)) * fontSizeVw(state?.font_size ?? null)) / 100;

  // Text keeps the size that was chosen. Auto-fit may trim it a little (never below 70%) when that makes a
  // short text fit; anything longer stays at full size and scrolls instead of shrinking into small print.
  useLayoutEffect(() => {
    const el = textRef.current;
    const box = boxRef.current;
    if (!el || !box || isBlank) return;

    const apply = () => {
      const base = basePx();
      el.style.fontSize = `${base}px`;
      if (!state?.auto_fit) return;
      const room = box.clientHeight - (state?.language ? 90 : 0);
      if (el.scrollHeight <= room) return;
      for (let s = 0.95; s >= 0.7; s -= 0.05) {
        el.style.fontSize = `${base * s}px`;
        if (el.scrollHeight <= room) return;
      }
      el.style.fontSize = `${base}px`;
    };

    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isBlank, started]);

  const following = pos >= 0;

  function wordStyle(index: number, isNumber: boolean): CSSProperties {
    if (isNumber) return { color: "#d4af37", fontWeight: 700, opacity: following && index < pos ? 0.6 : 1 };
    if (!following) return {};
    if (index === pos) return { backgroundColor: "rgba(212,175,55,0.45)", borderRadius: "0.2em", padding: "0 0.08em" };
    if (index < pos) return { opacity: 0.5 };
    return {};
  }

  return (
    <main className={`flex h-screen w-full flex-col overflow-hidden bg-navy px-10 py-8 text-center md:px-20 ${started ? "cursor-none" : ""}`}>
      {isBlank ? (
        <div className="m-auto font-serif text-4xl text-gold/30">{churchName}</div>
      ) : (
        <>
          {state?.title && <div className="mb-6 shrink-0 font-serif text-4xl font-bold text-gold md:text-5xl">{state.title}</div>}

          <div
            ref={boxRef}
            className="min-h-0 w-full flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none" }}
          >
            <div className="mx-auto flex min-h-full w-full max-w-[96rem] flex-col items-center justify-center">
              {body && (
                <div
                  ref={textRef}
                  className="w-full text-white"
                  style={{
                    fontFamily: fontFamilyStyle(state?.font_family ?? null),
                    lineHeight: lineHeightValue(state?.line_spacing ?? null),
                    textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                  }}
                >
                  {parsed.lines.map((line, lineIndex) =>
                    line.start === line.end ? (
                      <div key={lineIndex} style={{ height: "0.7em" }} />
                    ) : (
                      <div key={lineIndex}>
                        {parsed.tokens.slice(line.start, line.end).map((token, offset) => {
                          const index = line.start + offset;
                          return (
                            <span
                              key={index}
                              ref={(el) => {
                                wordRefs.current[index] = el;
                              }}
                              style={wordStyle(index, token.isNumber)}
                            >
                              {token.text}{" "}
                            </span>
                          );
                        })}
                      </div>
                    )
                  )}
                </div>
              )}

              {state?.language && <div className="mt-10 font-sans text-2xl uppercase tracking-[0.3em] text-gold/70">{state.language}</div>}
            </div>
          </div>
        </>
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
