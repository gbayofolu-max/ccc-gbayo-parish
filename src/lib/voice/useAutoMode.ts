"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseSpoken, parseInstant, commandFromIntent, looksLikeCommand, looksLikeQuote, canonicalBook, type SpokenCommand } from "@/lib/voice/parseSpoken";
import { Aligner, buildLines, textKey, type Token } from "@/lib/voice/readAlong";
import type { ScreenCommand } from "@/components/presentation/ProjectorScreen";
import { formatMeaning, meaningTitle } from "@/lib/voice/meaning";

export interface PassageInfo {
  text: string; // exactly what is on the projector
  numbered: boolean; // Bible text: each line starts with a verse number
  live: boolean; // is it on the projector right now?
}

export interface AutoActions {
  showVerse: (command: Extract<SpokenCommand, { type: "verse" }>) => void;
  showHymn: (command: Extract<SpokenCommand, { type: "hymn" }>) => void;
  next: () => void;
  previous: () => void;
  blank: () => void;
  switchLanguage: (language: "english" | "yoruba") => void;
  getPassage: () => PassageInfo;
  // Put a text slide on the screen (show = true) or only in the preview to be checked first (show = false).
  showText?: (title: string, body: string, show: boolean) => void;
  showAnnouncement?: () => void; // put the announcement typed in the Announcement tab on the screen
  slideCount?: () => number; // how many slides the current passage has
}

export interface VoiceLogEntry {
  id: number;
  time: string;
  heard: string;
  outcome: string;
}

interface Pending {
  label: string;
  secondsLeft: number;
}

const STORAGE_KEY = "presentation-voice-v2";
const GATE_LEVELS: Record<string, number> = { off: 0, low: 0.012, medium: 0.03, high: 0.06 };

// Auto mode: listens through the microphone (Chrome's built-in speech recognition).
//  - A clear reference ("John chapter 3 verse 16", "hymn number 5") goes on the screen after a short cancel window.
//  - While a passage is on the screen it follows the reading: the projector highlights and scrolls at the preacher's pace.
//  - "Wait" / "hold on" pauses the following, "continue" resumes it, "go back to verse 5" jumps back.
// Nothing is recorded or sent to this website. Reading position travels to the projector over a live channel, never the database.
export function useAutoMode(actions: AutoActions) {
  const [enabled, setEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [log, setLog] = useState<VoiceLogEntry[]>([]);
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [navigation, setNavigation] = useState(true);
  const [accent, setAccent] = useState("en-NG");
  const [supported, setSupported] = useState(true);
  const [follow, setFollow] = useState(true);
  const [gate, setGate] = useState("off");
  const [ai, setAi] = useState(true);
  const [quotes, setQuotes] = useState(true);
  const [verseInstant, setVerseInstant] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [meaningLanguage, setMeaningLanguage] = useState<"english" | "yoruba" | "both">("english");
  const [checkYoruba, setCheckYoruba] = useState(true);
  const [lookup, setLookup] = useState("");
  const [suggestions, setSuggestions] = useState<{ id: number; label: string; command: SpokenCommand }[]>([]);
  const [stepLines, setStepLines] = useState(2);
  const [hymnInstant, setHymnInstant] = useState(true);
  const [pace, setPace] = useState(0); // seconds per step for timed scrolling, 0 = off
  const [projectors, setProjectors] = useState(0);
  const [lastScroll, setLastScroll] = useState<ScreenCommand | null>(null);
  const [paused, setPaused] = useState(false);
  const [reading, setReading] = useState<{ verse: number | null; word: number; total: number }>({ verse: null, word: -1, total: 0 });
  const [level, setLevel] = useState(0);

  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const settingsRef = useRef({ delaySeconds, navigation, follow, gate, ai, stepLines, hymnInstant, quotes, meaningLanguage, checkYoruba, verseInstant, autoAdvance });
  settingsRef.current = { delaySeconds, navigation, follow, gate, ai, stepLines, hymnInstant, quotes, meaningLanguage, checkYoruba, verseInstant, autoAdvance };
  const readingRef = useRef(reading);
  readingRef.current = reading;
  const suggestionsRef = useRef(suggestions);
  suggestionsRef.current = suggestions;
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  const recognitionRef = useRef<any>(null);
  const wantRunning = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const instantTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKey = useRef({ key: "", at: 0 });
  const logId = useRef(0);
  const lastLoudAt = useRef(0);
  const scrollNonce = useRef(0);
  const aiBusy = useRef(false);
  const quoteBusy = useRef(false);
  const refTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const smartNextRef = useRef<() => void>(() => {});
  const smartPreviousRef = useRef<() => void>(() => {});
  const quoteCalls = useRef<number[]>([]);
  const lastQuoteText = useRef("");
  const aiCalls = useRef<number[]>([]);

  const channelRef = useRef<any>(null);
  const alignRef = useRef<{ key: string; aligner: Aligner; tokens: Token[] } | null>(null);
  const lastSent = useRef(0);
  const trailing = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addLog = useCallback((heardText: string, outcome: string) => {
    logId.current += 1;
    const entry: VoiceLogEntry = {
      id: logId.current,
      time: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      heard: heardText.slice(0, 90),
      outcome,
    };
    setLog((current) => [entry, ...current].slice(0, 10));
  }, []);

  // ---- live channel to the projector (no database writes) ----
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("projector-sync", { config: { presence: { key: `control-${Math.random().toString(36).slice(2, 8)}` } } });
    // How many projector screens are connected right now (the second phone, or a laptop)?
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, any[]>;
        let count = 0;
        for (const key of Object.keys(state)) for (const meta of state[key]) if (meta?.role === "display") count++;
        setProjectors(count);
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, []);

  const send = useCallback((event: string, payload: Record<string, unknown>) => {
    try {
      channelRef.current?.send({ type: "broadcast", event, payload });
    } catch {
      // The projector simply misses this update; the next one corrects it.
    }
  }, []);

  const ensureAligner = useCallback(() => {
    const passage = actionsRef.current.getPassage();
    if (!passage.live || !passage.text) return null;
    const key = textKey(passage.text) + (passage.numbered ? "n" : "");

    if (alignRef.current?.key !== key) {
      const { tokens } = buildLines(passage.text, passage.numbered);
      alignRef.current = { key, tokens, aligner: new Aligner(tokens) };
      setReading({ verse: null, word: -1, total: tokens.length });
    }
    return alignRef.current;
  }, []);

  const report = useCallback(
    (index: number, jump: boolean) => {
      const state = alignRef.current;
      if (!state) return;
      setReading({ verse: state.tokens[index]?.verse ?? null, word: index, total: state.tokens.length });

      const flush = () => {
        lastSent.current = Date.now();
        send("pos", { key: state.key, i: index, jump, step: settingsRef.current.stepLines });
      };
      if (trailing.current) clearTimeout(trailing.current);
      const wait = jump ? 0 : Math.max(0, 120 - (Date.now() - lastSent.current));
      if (wait === 0) flush();
      else trailing.current = setTimeout(flush, wait);
    },
    [send]
  );

  const feedReading = useCallback(
    (text: string): boolean => {
      if (pausedRef.current || !settingsRef.current.follow) return false;
      const state = ensureAligner();
      if (!state) return false;
      const result = state.aligner.feed(text.trim().split(/\s+/));
      if (result) {
        report(result.index, result.jumped);

        // The last word has been read: after a moment, move on by itself (the next verse, or the next stanza).
        if (advanceTimer.current) {
          clearTimeout(advanceTimer.current);
          advanceTimer.current = null;
        }
        if (settingsRef.current.autoAdvance && state.aligner.remaining() <= 1) {
          const keyAtStart = state.key;
          advanceTimer.current = setTimeout(() => {
            advanceTimer.current = null;
            if (pausedRef.current || alignRef.current?.key !== keyAtStart) return;
            logRef.current("Finished reading", "Moved on by itself");
            smartNextRef.current();
          }, 1600);
        }
      }
      return !!result;
    },
    [ensureAligner, report]
  );

  const pause = useCallback(
    (why = "Paused") => {
      if (pausedRef.current) return;
      setPaused(true);
      pausedRef.current = true;
      send("pause", { paused: true });
      addLog(why, "Paused: screen holds still");
    },
    [addLog, send]
  );

  const resume = useCallback(
    (why = "Continue") => {
      if (!pausedRef.current) return;
      setPaused(false);
      pausedRef.current = false;
      send("pause", { paused: false });
      addLog(why, "Following the reading again");
    },
    [addLog, send]
  );

  const gotoVerse = useCallback(
    (verse: number, heardText = `Go to verse ${verse}`) => {
      const state = ensureAligner();
      if (!state) {
        addLog(heardText, "Nothing is on the screen to go back in");
        return;
      }
      const index = state.tokens.findIndex((t) => t.isNumber && t.verse === verse);
      if (index < 0) {
        addLog(heardText, `Verse ${verse} is not on the screen`);
        return;
      }
      state.aligner.setBefore(index + 1);
      if (pausedRef.current) resume("Go to verse");
      report(index, true);
      addLog(heardText, `Went to verse ${verse}`);
    },
    [addLog, ensureAligner, report, resume]
  );

  const scrollBy = useCallback(
    (direction: 1 | -1, amount: "small" | "normal" | "large" = "normal") => {
      send("scrollBy", { dir: direction, amount });
      scrollNonce.current += 1;
      setLastScroll({ nonce: scrollNonce.current, kind: "by", dir: direction, amount });
    },
    [send]
  );
  const scrollTo = useCallback(
    (to: "top" | "bottom") => {
      send("scrollTo", { to });
      scrollNonce.current += 1;
      setLastScroll({ nonce: scrollNonce.current, kind: "to", to });
    },
    [send]
  );
  // The preview on this page was scrolled by hand: the projector follows.
  const sendRatio = useCallback(
    (r: number, word?: number) => {
      const passage = actionsRef.current.getPassage();
      const key = passage.text ? textKey(passage.text) + (passage.numbered ? "n" : "") : "";
      send("ratio", { r, w: typeof word === "number" ? word : undefined, key });
    },
    [send]
  );

  // "Next" and "Previous" that understand what is on the screen. When a whole chapter is showing, they move to the next or earlier verse
  // inside it; otherwise (or at its end) they go to the next slide, and the page carries on into the following verses of the chapter.
  const smartNext = useCallback(() => {
    const a = actionsRef.current;
    const passage = a.getPassage();
    if (passage.live && passage.numbered && (a.slideCount?.() ?? 2) <= 1) {
      const state = ensureAligner();
      const target = (readingRef.current.verse ?? 0) + 1;
      if (state && state.tokens.some((t) => t.isNumber && t.verse === target)) {
        gotoVerse(target, "Next verse");
        return;
      }
    }
    a.next();
  }, [ensureAligner, gotoVerse]);
  smartNextRef.current = smartNext;

  const smartPrevious = useCallback(() => {
    const a = actionsRef.current;
    const passage = a.getPassage();
    const current = readingRef.current.verse;
    if (passage.live && passage.numbered && (a.slideCount?.() ?? 2) <= 1 && current !== null && current > 1) {
      const state = ensureAligner();
      if (state && state.tokens.some((t) => t.isNumber && t.verse === current - 1)) {
        gotoVerse(current - 1, "Previous verse");
        return;
      }
    }
    a.previous();
  }, [ensureAligner, gotoVerse]);
  smartPreviousRef.current = smartPrevious;

  // ---- commands that change what is on the screen (with a short cancel window) ----
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pendingRef = useRef<Pending | null>(null);
  pendingRef.current = pending;

  const cancelPending = useCallback(
    (reason = "Cancelled") => {
      const current = pendingRef.current;
      clearTimer();
      lastKey.current = { key: "", at: 0 };
      setPending(null);
      if (current) addLog(current.label, reason);
    },
    [addLog, clearTimer]
  );

  const run = useCallback((command: SpokenCommand) => {
    setSuggestions([]);
    const a = actionsRef.current;
    if (command.type === "verse") a.showVerse(command);
    else if (command.type === "hymn") a.showHymn(command);
    else if (command.type === "next") smartNextRef.current();
    else if (command.type === "previous") smartPreviousRef.current();
    else if (command.type === "announcement") {
      if (a.showAnnouncement) a.showAnnouncement();
      else logRef.current("Announcement", "Announcements are not set up on this page yet");
    }
    else if (command.type === "blank") a.blank();
    else if (command.type === "language") a.switchLanguage(command.language);
  }, []);

  const schedule = useCallback(
    (command: SpokenCommand, heardText: string, slow = false) => {
      const key = `${command.type}:${command.label}`;
      const now = Date.now();

      // The preacher often repeats a reference: do not flash the same thing again for a while. "Next" can be said twice in a row.
      const windowMs =
        command.type === "next" || command.type === "previous"
          ? 1200
          : command.type === "hymn"
            ? 30000
            : command.type === "blank" || command.type === "language" || command.type === "announcement"
              ? 3000
              : 8000;
      if (lastKey.current.key === key && now - lastKey.current.at < windowMs) {
        // A quick repeat (the half-finished and the finished version of one sentence) stays quiet.
        if (now - lastKey.current.at > 4000) addLog(heardText, `Ignored repeat: ${command.label}`);
        return;
      }
      lastKey.current = { key, at: now };

      clearTimer();
      // A hymn number goes on the screen at once (it then stays until another hymn number is said).
      // A quote found without a number or reference always gets a cancel window (at least 2 seconds).
      const s = settingsRef.current;
      const instant =
        command.type === "next" ||
        command.type === "previous" ||
        command.type === "blank" ||
        command.type === "language" ||
        command.type === "announcement" ||
        (command.type === "hymn" && s.hymnInstant) ||
        (command.type === "verse" && s.verseInstant);
      const delay = slow ? Math.max(2, s.delaySeconds) : instant ? 0 : s.delaySeconds;

      if (delay <= 0) {
        setPending(null);
        run(command);
        addLog(heardText, `Shown: ${command.label}`);
        return;
      }

      let remaining = delay * 4;
      setPending({ label: command.label, secondsLeft: delay });
      timerRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearTimer();
          setPending(null);
          run(command);
          addLog(heardText, `Shown: ${command.label}`);
        } else {
          setPending({ label: command.label, secondsLeft: Math.ceil(remaining / 4) });
        }
      }, 250);
    },
    [addLog, clearTimer, run]
  );

  // "Let's see the meaning of happiness": an AI writes a short meaning, which goes on the screen as a text slide.
  // When Yoruba is included, it waits in the preview so you can check the Yoruba before pressing Update screen.
  const runDefine = useCallback(
    async (command: Extract<SpokenCommand, { type: "define" }>, heardText: string) => {
      const language = command.language ?? settingsRef.current.meaningLanguage;
      if (!actionsRef.current.showText) {
        addLog(heardText, "Meanings are not set up on this page yet");
        return;
      }
      setLookup(`Looking up the meaning of "${command.term}"...`);
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        if (!token) throw new Error("not signed in");

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const res = await fetch("/api/voice/define", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ term: command.term, language }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        const body = await res.json();
        if (!res.ok || !body?.english) throw new Error(body?.error ?? "no meaning");

        const needsCheck = language !== "english" && settingsRef.current.checkYoruba;
        actionsRef.current.showText?.(meaningTitle(body.term ?? command.term), formatMeaning(body, language), !needsCheck);
        addLog(heardText, needsCheck ? `Meaning of ${command.term} is in the preview: check the Yoruba, then press Update screen` : `Shown: meaning of ${command.term}`);
      } catch {
        addLog(heardText, `Could not look up "${command.term}" (AI unavailable)`);
      } finally {
        setLookup("");
      }
    },
    [addLog]
  );

  const handleCommand = useCallback(
    (command: SpokenCommand, text: string) => {
      if (command.type === "pause") {
        // A real verse can contain the word "wait": ignore it when the text itself is about to say it.
        const state = alignRef.current;
        const first = text.toLowerCase().replace(/[^a-z\s]/g, "").trim().split(/\s+/)[0] ?? "";
        if (state && settingsRef.current.follow && state.aligner.upcoming(3).includes(first)) return;
        pause(text.trim());
      } else if (command.type === "resume") {
        resume(text.trim());
      } else if (command.type === "goto") {
        gotoVerse(command.verse, text.trim());
      } else if (command.type === "define") {
        runDefine(command, text.trim());
      } else if (command.type === "scroll") {
        if (command.where === "top" || command.where === "bottom") scrollTo(command.where);
        else scrollBy(command.where === "down" ? 1 : -1, command.amount);
        addLog(text.trim(), command.label);
      } else {
        schedule(command, text.trim());
      }
    },
    [addLog, gotoVerse, pause, resume, runDefine, schedule, scrollBy, scrollTo]
  );

  const logRef = useRef(addLog);
  logRef.current = addLog;
  const handleCommandRef = useRef(handleCommand);
  handleCommandRef.current = handleCommand;
  const feedRef = useRef(feedReading);
  feedRef.current = feedReading;

  // Smart understanding: when the fixed rules find nothing but the sentence looks like a command, an AI reads it.
  // It never acts alone: whatever it understands goes through the same cancel window as any spoken command.
  const interpretWithAI = useCallback(async (text: string) => {
    const now = Date.now();
    aiCalls.current = aiCalls.current.filter((t) => now - t < 60000);
    if (aiBusy.current || aiCalls.current.length >= 12) {
      logRef.current(text, "Heard, but no command found");
      return;
    }
    aiBusy.current = true;
    aiCalls.current.push(now);

    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) throw new Error("not signed in");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);
      const passage = actionsRef.current.getPassage();
      const res = await fetch("/api/voice/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: text.slice(0, 240), onScreen: passage.live ? (passage.numbered ? "bible" : "text") : "nothing" }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      const body = await res.json();
      const command = commandFromIntent(body?.intent);
      if (command) {
        logRef.current(text, `AI understood: ${command.label}`);
        handleCommandRef.current(command, text);
      } else {
        logRef.current(text, "Heard, but no command found");
      }
    } catch {
      logRef.current(text, "Heard, but no command found (AI unavailable)");
    } finally {
      aiBusy.current = false;
    }
  }, []);
  const aiRef = useRef(interpretWithAI);
  aiRef.current = interpretWithAI;

  // Quote finder: the preacher quotes a verse or the choir sings a hymn line without saying the number or reference.
  // A sure match goes through the cancel window; a likely one appears as a tap-to-show suggestion.
  const scheduleRef = useRef(schedule);
  scheduleRef.current = schedule;

  const findQuote = useCallback(async (text: string) => {
    const now = Date.now();
    quoteCalls.current = quoteCalls.current.filter((t) => now - t < 60000);
    if (quoteBusy.current || quoteCalls.current.length >= 10 || text === lastQuoteText.current) {
      logRef.current(text, "Heard, but no command found");
      return;
    }
    lastQuoteText.current = text;
    quoteBusy.current = true;
    quoteCalls.current.push(now);

    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) throw new Error("not signed in");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch("/api/voice/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: text.slice(0, 300) }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      const body = await res.json();
      const found: { label: string; command: SpokenCommand }[] = [];
      for (const m of Array.isArray(body?.matches) ? body.matches.slice(0, 3) : []) {
        const command =
          m?.type === "hymn"
            ? commandFromIntent({ intent: "hymn", number: m.number, language: m.language })
            : commandFromIntent({ intent: "verse", book: canonicalBook(String(m?.book ?? "")) ?? m?.book, chapter: m?.chapter, verseStart: m?.verse, verseEnd: "", language: m?.language });
        if (command) found.push({ label: `${command.label}${"language" in command && command.language ? ` (${command.language})` : ""}`, command });
      }

      if (found.length === 0) {
        logRef.current(text, "Heard, but no command found");
      } else if (body?.confidence === "high") {
        logRef.current(text, `Quote recognised: ${found[0].command.label}`);
        scheduleRef.current(found[0].command, text, true);
      } else {
        logRef.current(text, `Possible quote: ${found.map((f) => f.command.label).join(", ")}`);
        setSuggestions(found.map((f, i) => ({ id: Date.now() + i, label: f.label, command: f.command })));
      }
    } catch {
      logRef.current(text, "Heard, but no command found (quote finder unavailable)");
    } finally {
      quoteBusy.current = false;
    }
  }, []);
  const quoteRef = useRef(findQuote);
  quoteRef.current = findQuote;

  const acceptSuggestion = useCallback(
    (id: number) => {
      const chosen = suggestionsRef.current.find((s) => s.id === id);
      if (!chosen) return;
      run(chosen.command);
      addLog("Tapped a suggestion", `Shown: ${chosen.command.label}`);
    },
    [addLog, run]
  );
  const dismissSuggestions = useCallback(() => setSuggestions([]), []);

  // Suggestions go away by themselves after a minute.
  useEffect(() => {
    if (suggestions.length === 0) return;
    const timer = setTimeout(() => setSuggestions([]), 60000);
    return () => clearTimeout(timer);
  }, [suggestions]);

  // ---- settings ----
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
      if (typeof saved.delaySeconds === "number") setDelaySeconds(saved.delaySeconds);
      if (typeof saved.navigation === "boolean") setNavigation(saved.navigation);
      if (typeof saved.accent === "string") setAccent(saved.accent);
      if (typeof saved.follow === "boolean") setFollow(saved.follow);
      if (typeof saved.gate === "string" && saved.gate in GATE_LEVELS) setGate(saved.gate);
      if (typeof saved.ai === "boolean") setAi(saved.ai);
      if (typeof saved.stepLines === "number" && saved.stepLines >= 1 && saved.stepLines <= 6) setStepLines(saved.stepLines);
      if (typeof saved.hymnInstant === "boolean") setHymnInstant(saved.hymnInstant);
      if (typeof saved.quotes === "boolean") setQuotes(saved.quotes);
      if (["english", "yoruba", "both"].includes(saved.meaningLanguage)) setMeaningLanguage(saved.meaningLanguage);
      if (typeof saved.checkYoruba === "boolean") setCheckYoruba(saved.checkYoruba);
      if (typeof saved.verseInstant === "boolean") setVerseInstant(saved.verseInstant);
      if (typeof saved.autoAdvance === "boolean") setAutoAdvance(saved.autoAdvance);
      if (typeof saved.pace === "number" && saved.pace >= 0 && saved.pace <= 60) setPace(saved.pace);
    } catch {
      // Ignore unreadable saved settings.
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ delaySeconds, navigation, accent, follow, gate, ai, stepLines, hymnInstant, pace, quotes, meaningLanguage, checkYoruba, verseInstant, autoAdvance }));
    } catch {
      // Settings simply will not be remembered.
    }
  }, [delaySeconds, navigation, accent, follow, gate, ai, stepLines, hymnInstant, pace, quotes, meaningLanguage, checkYoruba, verseInstant, autoAdvance]);

  // ---- timed scrolling: when singing cannot be followed by the microphone, move on every few seconds ----
  useEffect(() => {
    if (!enabled || pace <= 0 || paused) return;
    const timer = setInterval(() => {
      if (!actionsRef.current.getPassage().live) return;
      send("stepLines", { lines: settingsRef.current.stepLines });
      scrollNonce.current += 1;
      setLastScroll({ nonce: scrollNonce.current, kind: "lines", lines: settingsRef.current.stepLines });
    }, pace * 1000);
    return () => clearInterval(timer);
  }, [enabled, pace, paused, send]);

  // ---- loud-voice gate: ignore speech that is much quieter than the preacher's microphone ----
  useEffect(() => {
    if (!enabled || gate === "off") return;
    let stream: MediaStream | null = null;
    let context: AudioContext | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } });
        if (cancelled) return;
        context = new AudioContext();
        const analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        context.createMediaStreamSource(stream).connect(analyser);
        const data = new Float32Array(analyser.fftSize);
        const threshold = GATE_LEVELS[gate];

        interval = setInterval(() => {
          analyser.getFloatTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
          const rms = Math.sqrt(sum / data.length);
          setLevel(Math.min(1, rms * 8));
          if (rms >= threshold) lastLoudAt.current = Date.now();
        }, 100);
      } catch {
        setError("The loud-voice filter could not open the microphone, so it is off. Auto mode still works.");
        setGate("off");
      }
    })();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      stream?.getTracks().forEach((t) => t.stop());
      context?.close().catch(() => {});
      setLevel(0);
    };
  }, [enabled, gate]);

  const quiet = () => settingsRef.current.gate !== "off" && Date.now() - lastLoudAt.current > 1500;

  // Is the person just reading out what is already on the screen? Then it is not a new quote or a command.
  const readingTheScreen = (text: string) => {
    const state = alignRef.current;
    const w = text.trim().split(/\s+/);
    return !!state && w.length >= 3 && state.aligner.overlap(w) >= 0.6;
  };

  // ---- the microphone listener ----
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!enabled || !SR) return;

    wantRunning.current = true;
    setError("");

    let wakeLock: any = null;
    const holdAwake = async () => {
      try {
        wakeLock = await (navigator as any).wakeLock?.request("screen");
      } catch {
        // Not supported here: the device may sleep, nothing else is affected.
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") holdAwake();
    };
    holdAwake();
    document.addEventListener("visibilitychange", onVisible);

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.lang = accent;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];

        if (quiet()) {
          if (result.isFinal) setHeard("");
          continue;
        }

        if (!result.isFinal) {
          const text: string = result[0].transcript;
          setHeard(text);
          feedRef.current(text);

          // "Wait" / "continue" act quickly, but only once the speaker has stopped on that word for a moment.
          if (instantTimer.current) clearTimeout(instantTimer.current);
          const instant = parseInstant(text);
          if (instant) {
            instantTimer.current = setTimeout(() => handleCommandRef.current(instant, text), 450);
          }

          // A hymn number or Bible reference is acted on while the person is still speaking, once it has stayed the same for a moment.
          if (refTimer.current) clearTimeout(refTimer.current);
          const reference = parseSpoken(text, { navigation: false });
          if (reference && (reference.type === "hymn" || reference.type === "verse") && !readingTheScreen(text)) {
            refTimer.current = setTimeout(() => handleCommandRef.current(reference, text), 1000);
          }
          continue;
        }

        if (instantTimer.current) clearTimeout(instantTimer.current);
        if (refTimer.current) clearTimeout(refTimer.current);
        setHeard("");
        if (!String(result[0]?.transcript ?? "").trim()) continue; // silence: nothing to do, nothing to list
        let matched = false;

        for (let a = 0; a < result.length && !matched; a++) {
          const text: string = result[a].transcript;
          const command = parseSpoken(text, { navigation: settingsRef.current.navigation });
          if (command) {
            matched = true;
            handleCommandRef.current(command, text);
          }
        }

        if (!matched) {
          const moved = feedRef.current(result[0].transcript);
          // Short sentences that were not a command are listed, so you can see what the microphone actually heard.
          const heardText: string = result[0].transcript;
          if (!moved && !readingTheScreen(heardText)) {
            const short = heardText.trim().split(/\s+/).length <= 16;
            if (short && settingsRef.current.ai && looksLikeCommand(heardText)) aiRef.current(heardText);
            else if (settingsRef.current.quotes && looksLikeQuote(heardText)) quoteRef.current(heardText);
            else if (short) logRef.current(heardText, "Heard, but no command found");
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        wantRunning.current = false;
        setError("The microphone is blocked. Click the padlock in the address bar, allow the microphone, then switch Auto mode on again.");
        setEnabled(false);
      } else if (event.error === "audio-capture") {
        setError("No microphone was found on this device.");
      } else if (event.error === "language-not-supported") {
        setError("This browser does not support that language for listening. Choose Nigerian English instead.");
      } else if (event.error === "network") {
        setError("The speech service cannot be reached. Check the internet connection. Trying again...");
      }
    };

    recognition.onend = () => {
      setListening(false);
      if (wantRunning.current) {
        setTimeout(() => {
          if (!wantRunning.current) return;
          try {
            recognition.start();
          } catch {
            // Already starting: ignore.
          }
        }, 400);
      }
    };

    try {
      recognition.start();
    } catch {
      // Already started.
    }

    return () => {
      wantRunning.current = false;
      document.removeEventListener("visibilitychange", onVisible);
      try {
        wakeLock?.release();
      } catch {
        // Already released.
      }
      if (instantTimer.current) clearTimeout(instantTimer.current);
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        // Already stopped.
      }
      setListening(false);
      setHeard("");
    };
  }, [enabled, accent]);

  useEffect(
    () => () => {
      clearTimer();
      if (trailing.current) clearTimeout(trailing.current);
    },
    [clearTimer]
  );

  // When the passage on the screen changes, forget the old reading position straight away (not only when the next words are heard).
  useEffect(() => {
    const timer = setInterval(() => {
      const passage = actionsRef.current.getPassage();
      const key = passage.live && passage.text ? textKey(passage.text) + (passage.numbered ? "n" : "") : "";
      if (alignRef.current && alignRef.current.key !== key) {
        alignRef.current = null;
        if (advanceTimer.current) {
          clearTimeout(advanceTimer.current);
          advanceTimer.current = null;
        }
        setReading({ verse: null, word: -1, total: 0 });
      }
    }, 400);
    return () => clearInterval(timer);
  }, []);

  const toggle = useCallback(() => {
    if (enabled) {
      cancelPending("Auto mode switched off");
      setPaused(false);
      pausedRef.current = false;
    }
    setError("");
    setEnabled(!enabled);
  }, [enabled, cancelPending]);

  return {
    supported,
    enabled,
    toggle,
    listening,
    heard,
    error,
    pending,
    cancelPending: () => cancelPending("Cancelled"),
    log,
    delaySeconds,
    setDelaySeconds,
    navigation,
    setNavigation,
    accent,
    setAccent,
    follow,
    setFollow,
    gate,
    setGate,
    ai,
    setAi,
    quotes,
    setQuotes,
    verseInstant,
    setVerseInstant,
    autoAdvance,
    setAutoAdvance,
    meaningLanguage,
    setMeaningLanguage,
    checkYoruba,
    setCheckYoruba,
    lookup,
    suggestions,
    acceptSuggestion,
    dismissSuggestions,
    stepLines,
    setStepLines,
    hymnInstant,
    setHymnInstant,
    pace,
    setPace,
    projectors,
    lastScroll,
    sendRatio,
    level,
    paused,
    pause: () => pause("Pause button"),
    resume: () => resume("Continue button"),
    gotoVerse: (verse: number) => gotoVerse(verse, `Go to verse ${verse} (button)`),
    scrollBy,
    scrollTo,
    reading,
  };
}

export type AutoModeApi = ReturnType<typeof useAutoMode>;
