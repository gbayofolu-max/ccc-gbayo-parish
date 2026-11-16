"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { textKey } from "@/lib/voice/readAlong";
import ProjectorScreen, { type ScreenCommand } from "@/components/presentation/ProjectorScreen";

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

export default function PresentationPage() {
  const [state, setState] = useState<PresentationState | null>(null);
  const [realtimeOn, setRealtimeOn] = useState(false);
  const [started, setStarted] = useState(false);
  const [churchName, setChurchName] = useState("CCC Gbayo Parish");
  const [pos, setPos] = useState(-1); // word the reader has just reached (-1: not following yet)
  const [step, setStep] = useState(2);
  const [command, setCommand] = useState<ScreenCommand | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [debug, setDebug] = useState(false);
  const [stats, setStats] = useState<{ counts: Record<string, number>; last: string; at: number }>({ counts: {}, last: "", at: 0 });
  const [metrics, setMetrics] = useState("");
  const [peers, setPeers] = useState(0);
  const wakeLock = useRef<any>(null);
  const nonce = useRef(0);

  const isBlank = !state || state.content_type === "blank";
  const body = state?.body_text ?? "";
  const numbered = state?.content_type === "verse";
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

  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
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

  // Reading position, scrolling and the "I am a projector" signal, from and to the control phone. Live channel only: nothing is stored.
  useEffect(() => {
    const supabase = createClient();
    const send = (c: Omit<ScreenCommand, "nonce">) => {
      nonce.current += 1;
      setCommand({ ...c, nonce: nonce.current });
    };
    const note = (name: string) =>
      setStats((s) => ({ counts: { ...s.counts, [name]: (s.counts[name] ?? 0) + 1 }, last: name, at: Date.now() }));

    const channel = supabase
      .channel("projector-sync")
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, any[]>;
        let n = 0;
        for (const k of Object.keys(state)) for (const meta of state[k]) if (meta?.role !== "display") n++;
        setPeers(n);
      })
      .on("broadcast", { event: "pos" }, ({ payload }: any) => {
        note("pos");
        if (!payload || payload.key !== keyRef.current || typeof payload.i !== "number") return;
        if (typeof payload.step === "number") setStep(payload.step);
        setPos(payload.i);
      })
      .on("broadcast", { event: "scrollBy" }, ({ payload }: any) => {
        note("scrollBy");
        send({ kind: "by", dir: payload?.dir === -1 ? -1 : 1, amount: payload?.amount });
      })
      .on("broadcast", { event: "scrollTo" }, ({ payload }: any) => {
        note("scrollTo");
        send({ kind: "to", to: payload?.to === "bottom" ? "bottom" : "top" });
      })
      .on("broadcast", { event: "stepLines" }, ({ payload }: any) => {
        note("stepLines");
        send({ kind: "lines", lines: typeof payload?.lines === "number" ? payload.lines : 2 });
      })
      .on("broadcast", { event: "ratio" }, ({ payload }: any) => {
        note("ratio");
        if (typeof payload?.r !== "number") return;
        // The same word goes to the top as in the control page's preview (exact), or the same share of the way down (fallback).
        if (payload.key && payload.key === keyRef.current && typeof payload.w === "number") send({ kind: "word", word: payload.w, ratio: payload.r });
        else send({ kind: "ratio", ratio: payload.r });
      })
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") channel.track({ role: "display", at: Date.now() });
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // A new passage starts with nothing marked as read.
  useEffect(() => {
    setPos(-1);
  }, [key]);

  // Add ?debug=1 to this page's address to see what it is receiving (for fixing problems).
  useEffect(() => {
    setDebug(new URLSearchParams(window.location.search).get("debug") === "1");
  }, []);

  useEffect(() => {
    if (!debug) return;
    const timer = setInterval(() => {
      const box = document.querySelector("[data-scrollbox]") as HTMLElement | null;
      setMetrics(box ? `scrolled ${Math.round(box.scrollTop)} of ${Math.round(box.scrollHeight - box.clientHeight)} px (${box.scrollHeight - box.clientHeight > 2 ? "can scroll" : "NOTHING TO SCROLL: all text fits"})` : "no text on screen");
    }, 500);
    return () => clearInterval(timer);
  }, [debug]);

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

  return (
    <main className={`h-screen w-full overflow-hidden bg-navy ${started ? "cursor-none" : ""}`}>
      {isBlank || size.w === 0 ? (
        <div className="flex h-full w-full items-center justify-center font-serif text-4xl text-gold/30">{churchName}</div>
      ) : (
        <ProjectorScreen
          width={size.w}
          height={size.h}
          title={state?.title ?? null}
          text={body}
          numbered={numbered}
          language={state?.language ?? null}
          fontFamily={state?.font_family ?? null}
          fontSize={state?.font_size ?? null}
          lineSpacing={state?.line_spacing ?? null}
          autoFit={!!state?.auto_fit}
          pos={pos}
          step={step}
          command={command}
        />
      )}

      {debug && (
        <div className="fixed left-2 top-2 z-[60] max-w-[90vw] rounded-lg bg-black/80 p-3 text-left font-mono text-sm leading-6 text-green-300">
          <div>live database link: {realtimeOn ? "ON" : "OFF"}</div>
          <div>control phones seen: {peers}</div>
          <div>
            received:{" "}
            {Object.keys(stats.counts).length === 0
              ? "nothing yet"
              : Object.entries(stats.counts)
                  .map(([k, v]) => `${k} ${v}`)
                  .join(", ")}
          </div>
          <div>last: {stats.last ? `${stats.last} ${Math.max(0, Math.round((Date.now() - stats.at) / 1000))}s ago` : "-"}</div>
          <div>{metrics}</div>
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
