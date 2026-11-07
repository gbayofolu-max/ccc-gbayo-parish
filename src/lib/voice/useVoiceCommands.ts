"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseSpoken, type SpokenCommand } from "@/lib/voice/parseSpoken";

export interface VoiceActions {
  showVerse: (command: Extract<SpokenCommand, { type: "verse" }>) => void;
  showHymn: (command: Extract<SpokenCommand, { type: "hymn" }>) => void;
  next: () => void;
  previous: () => void;
  blank: () => void;
  switchLanguage: (language: "english" | "yoruba") => void;
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

const STORAGE_KEY = "presentation-voice-v1";

// Listens through the microphone (Chrome's built-in speech recognition) and turns clear spoken
// references into screen commands. Nothing is recorded or sent to this website: only the words
// that match a command are used, and only the last few are kept on this page.
export function useVoiceCommands(actions: VoiceActions) {
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

  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const settingsRef = useRef({ delaySeconds, navigation });
  settingsRef.current = { delaySeconds, navigation };

  const recognitionRef = useRef<any>(null);
  const wantRunning = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastKey = useRef({ key: "", at: 0 });
  const logId = useRef(0);

  const addLog = useCallback((heardText: string, outcome: string) => {
    logId.current += 1;
    const entry: VoiceLogEntry = {
      id: logId.current,
      time: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      heard: heardText.slice(0, 90),
      outcome,
    };
    setLog((current) => [entry, ...current].slice(0, 8));
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cancelPending = useCallback(
    (reason = "Cancelled") => {
      clearTimer();
      setPending((current) => {
        if (current) addLog(current.label, reason);
        return null;
      });
    },
    [addLog, clearTimer]
  );

  const run = useCallback((command: SpokenCommand) => {
    const a = actionsRef.current;
    if (command.type === "verse") a.showVerse(command);
    else if (command.type === "hymn") a.showHymn(command);
    else if (command.type === "next") a.next();
    else if (command.type === "previous") a.previous();
    else if (command.type === "blank") a.blank();
    else if (command.type === "language") a.switchLanguage(command.language);
  }, []);

  const schedule = useCallback(
    (command: SpokenCommand, heardText: string) => {
      const key = `${command.type}:${command.label}`;
      const now = Date.now();

      // The preacher often repeats a reference: do not flash the same thing again within 8 seconds.
      if (lastKey.current.key === key && now - lastKey.current.at < 8000) {
        addLog(heardText, `Ignored repeat: ${command.label}`);
        return;
      }
      lastKey.current = { key, at: now };

      clearTimer();
      const delay = settingsRef.current.delaySeconds;

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

  const scheduleRef = useRef(schedule);
  scheduleRef.current = schedule;

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
      if (typeof saved.delaySeconds === "number") setDelaySeconds(saved.delaySeconds);
      if (typeof saved.navigation === "boolean") setNavigation(saved.navigation);
      if (typeof saved.accent === "string") setAccent(saved.accent);
    } catch {
      // Ignore unreadable saved settings.
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ delaySeconds, navigation, accent }));
    } catch {
      // Settings simply will not be remembered.
    }
  }, [delaySeconds, navigation, accent]);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!enabled || !SR) return;

    wantRunning.current = true;
    setError("");

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

        if (!result.isFinal) {
          setHeard(result[0].transcript);
          continue;
        }

        setHeard("");
        let matched = false;

        for (let a = 0; a < result.length && !matched; a++) {
          const text: string = result[a].transcript;
          const command = parseSpoken(text, { navigation: settingsRef.current.navigation });
          if (command) {
            matched = true;
            scheduleRef.current(command, text.trim());
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

  useEffect(() => () => clearTimer(), [clearTimer]);

  const toggle = useCallback(() => {
    setEnabled((current) => {
      if (current) cancelPending("Auto mode switched off");
      return !current;
    });
  }, [cancelPending]);

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
  };
}
