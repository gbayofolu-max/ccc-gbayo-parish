"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Tab = "verse" | "hymn" | "custom";
type HymnLanguage = "both" | "yoruba" | "english";
type SlideMode = "all" | "split";

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
  parts?: { yoruba: string; english: string } | null;
}

interface Slide {
  title: string | null;
  text: string;
}

interface ScreenState {
  content_type: string;
  title: string | null;
  body_text: string | null;
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-navy placeholder:text-gray-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-light/70";
const STORAGE_KEY = "presentation-control-v2";

function fontFamilyStyle(fontFamily: string): string {
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

// Text size as a percentage of the screen width, so the preview and every projector look the same.
function fontSizeVw(fontSize: string): number {
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

function lineHeightValue(lineSpacing: string): number {
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

function splitStanzas(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

// "gen 3:1", "john 3 vs 16-18", "1 cor 13", "hymn 5" or just "5" (a hymn number).
function parseQuick(input: string):
  | { kind: "hymn"; number: string }
  | { kind: "verse"; book: string; chapter: string; verseStart: string; verseEnd: string }
  | null {
  const text = input.trim().replace(/\s+/g, " ");
  if (!text) return null;

  const hymn = /^(?:hymns?|h)\s*(?:no\.?|number|#)?\s*(\d{1,4})$/i.exec(text) ?? /^(\d{1,4})$/.exec(text);
  if (hymn) return { kind: "hymn", number: hymn[1] };

  const m =
    /^((?:[1-3]|i{1,3})\.?\s*)?([a-z]+(?:\s+[a-z]+)*?)\s+(?:chapter\s+|ch\.?\s*)?(\d{1,3})(?:\s*(?::|\.|,|vs?\.?|verses?)\s*(\d{1,3})(?:\s*(?:-|–|to)\s*(\d{1,3}))?)?$/i.exec(
      text
    );
  if (!m) return null;

  const romans: Record<string, string> = { i: "1", ii: "2", iii: "3" };
  const prefixRaw = (m[1] ?? "").replace(".", "").trim().toLowerCase();
  const prefix = romans[prefixRaw] ?? prefixRaw;

  return {
    kind: "verse",
    book: `${prefix ? prefix + " " : ""}${m[2]}`.trim(),
    chapter: m[3],
    verseStart: m[4] ?? "",
    verseEnd: m[5] ?? "",
  };
}

function buildSlides(
  result: LookupResult | null,
  slideMode: SlideMode,
  versesPerSlide: number,
  hymnLanguage: HymnLanguage
): Slide[] {
  if (!result || !result.body_text) return [];
  const whole: Slide[] = [{ title: result.title, text: result.body_text }];

  if (slideMode !== "split") return whole;

  if (result.content_type === "verse" && result.verses && result.verses.length > 0) {
    const chapterRef = (result.reference ?? result.title ?? "").replace(/:.*$/, "");
    const slides: Slide[] = [];
    for (let i = 0; i < result.verses.length; i += versesPerSlide) {
      const group = result.verses.slice(i, i + versesPerSlide);
      const first = group[0].verse;
      const last = group[group.length - 1].verse;
      slides.push({
        title: chapterRef ? `${chapterRef}:${first}${last > first ? "–" + last : ""}` : result.title,
        text: group.map((v) => `${v.verse} ${v.text}`).join("\n"),
      });
    }
    return slides.length > 0 ? slides : whole;
  }

  if (result.content_type === "hymn" && result.parts) {
    const yo = splitStanzas(result.parts.yoruba);
    const en = splitStanzas(result.parts.english);
    if (hymnLanguage === "yoruba" && yo.length > 0) return yo.map((text) => ({ title: result.title, text }));
    if (hymnLanguage === "english" && en.length > 0) return en.map((text) => ({ title: result.title, text }));
    if (hymnLanguage === "both" && yo.length > 0 && yo.length === en.length) {
      return yo.map((text, i) => ({ title: result.title, text: `${text}\n\n${en[i]}` }));
    }
    return whole;
  }

  if (result.content_type === "announcement") {
    const parts = result.body_text
      .split(/\n\s*---+\s*\n/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length > 1) return parts.map((text) => ({ title: result.title, text }));
  }

  return whole;
}

function ScreenPreview(props: {
  title: string | null;
  text: string;
  language: string | null;
  fontFamily: string;
  fontSize: string;
  lineSpacing: string;
  autoFit: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / 1280);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const basePx = (fontSizeVw(props.fontSize) / 100) * 1280;

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.fontSize = `${basePx}px`;
    const limit = 720 * (props.title ? 0.72 : 0.84);

    if (props.autoFit) {
      for (let s = 1; s >= 0.3; s -= 0.05) {
        el.style.fontSize = `${basePx * s}px`;
        if (el.scrollHeight <= limit) break;
      }
      setOverflow(false);
    } else {
      setOverflow(el.scrollHeight > limit);
    }
  }, [props.text, props.title, props.autoFit, props.fontFamily, props.fontSize, props.lineSpacing, basePx]);

  return (
    <div>
      <div ref={boxRef} className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-gold bg-navy">
        <div
          className="absolute left-0 top-0 flex flex-col items-center justify-center px-16 py-8 text-center"
          style={{ width: 1280, height: 720, transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          {props.title && (
            <div className="mb-6 font-serif text-4xl font-bold text-gold">{props.title}</div>
          )}
          <div
            ref={textRef}
            className="whitespace-pre-line text-white"
            style={{
              fontFamily: fontFamilyStyle(props.fontFamily),
              lineHeight: lineHeightValue(props.lineSpacing),
              fontSize: `${basePx}px`,
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            {props.text}
          </div>
          {props.language && (
            <div className="mt-6 font-sans text-2xl uppercase tracking-[0.3em] text-gold/70">{props.language}</div>
          )}
        </div>
      </div>
      {overflow && (
        <p className="mt-2 text-xs font-semibold text-red-600">
          This will not fit on the screen. Turn on Auto-fit, choose a smaller text size, or use one verse or stanza at a time.
        </p>
      )}
    </div>
  );
}

export default function PresentationControlPage() {
  const [tab, setTab] = useState<Tab>("verse");

  const [quick, setQuick] = useState("");
  const [autoShow, setAutoShow] = useState(true);

  const [book, setBook] = useState("");
  const [chapter, setChapter] = useState("");
  const [verseStart, setVerseStart] = useState("");
  const [verseEnd, setVerseEnd] = useState("");
  const [language, setLanguage] = useState<"english" | "yoruba">("english");

  const [hymnNumber, setHymnNumber] = useState("");
  const [hymnLanguage, setHymnLanguage] = useState<HymnLanguage>("both");

  const [customTitle, setCustomTitle] = useState("");
  const [customBody, setCustomBody] = useState("");

  const [result, setResult] = useState<LookupResult | null>(null);
  const [slideMode, setSlideMode] = useState<SlideMode>("all");
  const [versesPerSlide, setVersesPerSlide] = useState(2);
  const [slideIndex, setSlideIndex] = useState(0);
  const [liveIndex, setLiveIndex] = useState<number | null>(null);

  const [status, setStatus] = useState("");
  const [onScreen, setOnScreen] = useState<ScreenState | null>(null);
  const [copied, setCopied] = useState(false);

  const [fontFamily, setFontFamily] = useState("classic");
  const [fontSize, setFontSize] = useState("extra-large");
  const [lineSpacing, setLineSpacing] = useState("normal");
  const [autoFit, setAutoFit] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const slides = useMemo(
    () => buildSlides(result, slideMode, versesPerSlide, hymnLanguage),
    [result, slideMode, versesPerSlide, hymnLanguage]
  );
  const slide = slides[Math.min(slideIndex, Math.max(slides.length - 1, 0))] ?? null;
  const isLive = liveIndex !== null;

  // Remember this device's settings so they only have to be chosen once.
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
      if (typeof saved.fontFamily === "string") setFontFamily(saved.fontFamily);
      if (typeof saved.fontSize === "string") setFontSize(saved.fontSize);
      if (typeof saved.lineSpacing === "string") setLineSpacing(saved.lineSpacing);
      if (typeof saved.autoFit === "boolean") setAutoFit(saved.autoFit);
      if (typeof saved.autoShow === "boolean") setAutoShow(saved.autoShow);
      if (saved.language === "english" || saved.language === "yoruba") setLanguage(saved.language);
      if (saved.hymnLanguage === "both" || saved.hymnLanguage === "yoruba" || saved.hymnLanguage === "english") {
        setHymnLanguage(saved.hymnLanguage);
      }
      if (saved.slideMode === "all" || saved.slideMode === "split") setSlideMode(saved.slideMode);
      if (typeof saved.versesPerSlide === "number") setVersesPerSlide(saved.versesPerSlide);
    } catch {
      // Ignore unreadable saved settings.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ fontFamily, fontSize, lineSpacing, autoFit, autoShow, language, hymnLanguage, slideMode, versesPerSlide })
      );
    } catch {
      // Storage may be unavailable; settings simply will not be remembered.
    }
  }, [loaded, fontFamily, fontSize, lineSpacing, autoFit, autoShow, language, hymnLanguage, slideMode, versesPerSlide]);

  // What the congregation is seeing right now. Updates the moment the screen changes.
  useEffect(() => {
    let active = true;
    const supabase = createClient();

    fetch("/api/presentation", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (active && data) setOnScreen(data as ScreenState);
      })
      .catch(() => {});

    const channel = supabase
      .channel("control-presentation")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "presentation_state", filter: "id=eq.1" },
        (payload: any) => {
          if (active && payload.new) setOnScreen(payload.new as ScreenState);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const pushSlide = useCallback(
    async (target: Slide | null, index: number, base: LookupResult | null) => {
      if (!target || !base) return;
      setStatus("Sending to screen...");
      try {
        const res = await fetch("/api/presentation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content_type: base.content_type,
            title: target.title,
            body_text: target.text,
            reference: base.reference,
            language: base.language,
            font_family: fontFamily,
            font_size: fontSize,
            line_spacing: lineSpacing,
            auto_fit: autoFit,
          }),
        });
        if (res.ok) {
          setStatus("Now showing on screen.");
          setLiveIndex(index);
        } else if (res.status === 401 || res.status === 403) {
          setStatus("You are signed out or not allowed. Sign in again.");
        } else {
          setStatus("Failed to update screen.");
        }
      } catch {
        setStatus("Network error. Try again.");
      }
    },
    [fontFamily, fontSize, lineSpacing, autoFit]
  );

  function applyResult(data: LookupResult, show: boolean) {
    setResult(data);
    setSlideIndex(0);
    setLiveIndex(null);
    setStatus("");
    if (show) {
      const first = buildSlides(data, slideMode, versesPerSlide, hymnLanguage)[0] ?? null;
      pushSlide(first, 0, data);
    }
  }

  async function lookupVerse(
    parts: { book: string; chapter: string; verseStart: string; verseEnd: string },
    show: boolean
  ) {
    if (!parts.book.trim() || !parts.chapter.trim()) {
      setStatus("Enter at least a book and chapter.");
      return;
    }
    setStatus("Looking up...");
    try {
      const res = await fetch("/api/presentation/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "verse", ...parts, language }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Not found");
        setResult(null);
        return;
      }
      applyResult(data, show);
    } catch {
      setStatus("Network error. Try again.");
    }
  }

  async function lookupHymn(number: string, lang: HymnLanguage, show: boolean) {
    if (!number.trim()) {
      setStatus("Enter a hymn number.");
      return;
    }
    setStatus("Looking up...");
    try {
      const res = await fetch("/api/presentation/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "hymn", number, language: lang }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Not found");
        setResult(null);
        return;
      }
      applyResult(data, show);
    } catch {
      setStatus("Network error. Try again.");
    }
  }

  function runQuick() {
    const parsed = parseQuick(quick);
    if (!parsed) {
      setStatus('Try "gen 3:1", "john 3:16-18" or "hymn 5".');
      return;
    }
    if (parsed.kind === "hymn") {
      setTab("hymn");
      setHymnNumber(parsed.number);
      lookupHymn(parsed.number, hymnLanguage, autoShow);
    } else {
      setTab("verse");
      setBook(parsed.book);
      setChapter(parsed.chapter);
      setVerseStart(parsed.verseStart);
      setVerseEnd(parsed.verseEnd);
      lookupVerse(parsed, autoShow);
    }
  }

  function changeHymnLanguage(next: HymnLanguage) {
    setHymnLanguage(next);
    if (result?.content_type === "hymn" && hymnNumber.trim()) {
      lookupHymn(hymnNumber, next, isLive);
    }
  }

  function handleCustomPreview() {
    if (!customBody.trim()) {
      setStatus("Enter a message to show.");
      return;
    }
    applyResult(
      {
        content_type: "announcement",
        title: customTitle || null,
        body_text: customBody,
        reference: null,
        language: null,
        verses: null,
      },
      autoShow
    );
  }

  function showCurrent() {
    pushSlide(slide, Math.min(slideIndex, Math.max(slides.length - 1, 0)), result);
  }

  function goTo(next: number) {
    if (next < 0 || next >= slides.length) return;
    setSlideIndex(next);
    if (isLive) pushSlide(slides[next], next, result);
  }

  async function blankScreen() {
    setStatus("Clearing...");
    try {
      const res = await fetch("/api/presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_type: "blank" }),
      });
      if (res.ok) {
        setStatus("Screen cleared.");
        setLiveIndex(null);
      } else {
        setStatus("Failed to clear the screen.");
      }
    } catch {
      setStatus("Network error. Try again.");
    }
  }

  // Keyboard: Ctrl+Enter shows, Esc blanks, arrow keys move between verses or stanzas.
  const keyHandlers = useRef({ showCurrent, blankScreen, goTo, slideIndex });
  keyHandlers.current = { showCurrent, blankScreen, goTo, slideIndex };

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT");
      const h = keyHandlers.current;

      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        h.showCurrent();
      } else if (event.key === "Escape") {
        h.blankScreen();
      } else if (!typing && event.key === "ArrowRight") {
        event.preventDefault();
        h.goTo(h.slideIndex + 1);
      } else if (!typing && event.key === "ArrowLeft") {
        event.preventDefault();
        h.goTo(h.slideIndex - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function copyDisplayLink() {
    const link = `${window.location.origin}/presentation`;
    navigator.clipboard
      ?.writeText(link)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setStatus(`Display link: ${link}`));
  }

  const tabClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      active ? "bg-navy text-gold" : "bg-white text-navy border border-navy/20"
    }`;
  const chip = (active: boolean) =>
    `rounded-lg px-3 py-2 text-sm font-semibold ${active ? "bg-navy text-gold" : "bg-gray-100 text-navy"}`;

  const onScreenLabel =
    !onScreen || onScreen.content_type === "blank"
      ? "Nothing (blank screen)"
      : `${onScreen.title ? onScreen.title + ": " : ""}${(onScreen.body_text ?? "").replace(/\s+/g, " ").slice(0, 70)}`;

  return (
    <main className="min-h-screen bg-slate-50 px-6 pb-32 pt-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-bold text-navy">Presentation Control</h1>
            <p className="mt-1 text-sm text-navy-light/70">
              Keep this page on your own device. The congregation only sees the display screen.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={copyDisplayLink} className="rounded-lg border border-navy/20 bg-white px-3 py-2 text-sm font-semibold text-navy">
              {copied ? "Link copied" : "Copy display link"}
            </button>
            <a href="/presentation" target="_blank" rel="noreferrer" className="rounded-lg border border-navy/20 bg-white px-3 py-2 text-sm font-semibold text-navy">
              Open display
            </a>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-gold/50 bg-white p-4 shadow-sm">
          <label className={labelClass}>Quick search</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className={inputClass}
              placeholder='Type "gen 3:1", "john 3:16-18" or "hymn 5", then press Enter'
              value={quick}
              onChange={(e) => setQuick(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  runQuick();
                }
              }}
            />
            <button onClick={runQuick} className="rounded-lg bg-gold px-5 py-2 font-semibold text-navy">
              Go
            </button>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-navy">
            <input type="checkbox" checked={autoShow} onChange={(e) => setAutoShow(e.target.checked)} className="h-4 w-4 accent-navy" />
            Show on the screen straight away (otherwise it opens as a preview first)
          </label>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <button onClick={() => setTab("verse")} className={tabClass(tab === "verse")}>
                Bible Verse
              </button>
              <button onClick={() => setTab("hymn")} className={tabClass(tab === "hymn")}>
                Hymn
              </button>
              <button onClick={() => setTab("custom")} className={tabClass(tab === "custom")}>
                Announcement
              </button>
            </div>

            {tab === "verse" && (
              <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div>
                  <label className={labelClass}>Book</label>
                  <input className={inputClass} placeholder="e.g. John, 1 Corinthians, Psalm" value={book} onChange={(e) => setBook(e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <div className="w-full">
                    <label className={labelClass}>Chapter</label>
                    <input className={inputClass} placeholder="e.g. 3" value={chapter} onChange={(e) => setChapter(e.target.value)} />
                  </div>
                  <div className="w-full">
                    <label className={labelClass}>Verse</label>
                    <input className={inputClass} placeholder="e.g. 16" value={verseStart} onChange={(e) => setVerseStart(e.target.value)} />
                  </div>
                  <div className="w-full">
                    <label className={labelClass}>To verse</label>
                    <input className={inputClass} placeholder="e.g. 18" value={verseEnd} onChange={(e) => setVerseEnd(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Language</label>
                  <div className="flex gap-2">
                    <button onClick={() => setLanguage("english")} className={chip(language === "english")}>
                      English (KJV)
                    </button>
                    <button onClick={() => setLanguage("yoruba")} className={chip(language === "yoruba")}>
                      Yorùbá
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => lookupVerse({ book, chapter, verseStart, verseEnd }, autoShow)}
                  className="w-full rounded-lg bg-gold px-4 py-2 font-semibold text-navy"
                >
                  Look Up
                </button>
              </div>
            )}

            {tab === "hymn" && (
              <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div>
                  <label className={labelClass}>Hymn Number</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. 5"
                    value={hymnNumber}
                    onChange={(e) => setHymnNumber(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        lookupHymn(hymnNumber, hymnLanguage, autoShow);
                      }
                    }}
                  />
                </div>
                <div>
                  <label className={labelClass}>Show</label>
                  <div className="flex gap-2">
                    {(["both", "yoruba", "english"] as const).map((opt) => (
                      <button key={opt} onClick={() => changeHymnLanguage(opt)} className={chip(hymnLanguage === opt)}>
                        {opt === "both" ? "Both" : opt === "yoruba" ? "Yorùbá" : "English"}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => lookupHymn(hymnNumber, hymnLanguage, autoShow)} className="w-full rounded-lg bg-gold px-4 py-2 font-semibold text-navy">
                  Look Up
                </button>
              </div>
            )}

            {tab === "custom" && (
              <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div>
                  <label className={labelClass}>Title</label>
                  <input className={inputClass} placeholder="e.g. Welcome, Offering" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Message</label>
                  <textarea className={inputClass} rows={4} placeholder="Message to show. Put --- on its own line to start a new slide." value={customBody} onChange={(e) => setCustomBody(e.target.value)} />
                </div>
                <button onClick={handleCustomPreview} className="w-full rounded-lg bg-gold px-4 py-2 font-semibold text-navy">
                  {autoShow ? "Show" : "Preview"}
                </button>
              </div>
            )}

            <div className="mt-6 space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div>
                <h2 className="font-serif text-xl font-bold text-navy">Presentation Appearance</h2>
                <p className="mt-1 text-xs text-navy-light/60">Remembered on this device.</p>
              </div>

              <div>
                <label className={labelClass}>Font</label>
                <div className="grid grid-cols-2 gap-2">
                  {[["classic", "Classic"], ["modern", "Modern"], ["humanist", "Humanist"], ["readable", "Readable"]].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setFontFamily(value)} className={chip(fontFamily === value)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Text Size</label>
                <div className="grid grid-cols-2 gap-2">
                  {[["compact", "Compact"], ["standard", "Standard"], ["large", "Large"], ["extra-large", "Extra Large"], ["giant", "Giant"]].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setFontSize(value)} className={chip(fontSize === value)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Line Spacing</label>
                <div className="grid grid-cols-3 gap-2">
                  {[["tight", "Tight"], ["normal", "Normal"], ["spacious", "Spacious"]].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setLineSpacing(value)} className={chip(lineSpacing === value)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <span>
                  <span className="block text-sm font-semibold text-navy">Auto-fit</span>
                  <span className="block text-xs text-navy-light/60">Shrink long text so all of it fits on the screen.</span>
                </span>
                <input type="checkbox" checked={autoFit} onChange={(e) => setAutoFit(e.target.checked)} className="h-5 w-5 accent-navy" />
              </label>
            </div>
          </div>

          <div className="md:sticky md:top-6 md:self-start">
            {slide ? (
              <div>
                <ScreenPreview
                  title={slide.title}
                  text={slide.text}
                  language={result?.language ?? null}
                  fontFamily={fontFamily}
                  fontSize={fontSize}
                  lineSpacing={lineSpacing}
                  autoFit={autoFit}
                />

                {(result?.content_type === "verse" || result?.content_type === "hymn" || slides.length > 1) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-navy-light/70">Slides</span>
                    <button onClick={() => { setSlideMode("all"); setSlideIndex(0); setLiveIndex(null); }} className={chip(slideMode === "all")}>
                      Whole text
                    </button>
                    <button onClick={() => { setSlideMode("split"); setSlideIndex(0); setLiveIndex(null); }} className={chip(slideMode === "split")}>
                      {result?.content_type === "verse" ? "By verse" : "By stanza"}
                    </button>
                    {slideMode === "split" && result?.content_type === "verse" && (
                      <select
                        className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
                        value={versesPerSlide}
                        onChange={(e) => { setVersesPerSlide(Number(e.target.value)); setSlideIndex(0); setLiveIndex(null); }}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n} verse{n > 1 ? "s" : ""} per slide
                          </option>
                        ))}
                      </select>
                    )}
                    {slides.length > 1 && (
                      <span className="ml-auto text-sm font-semibold text-navy">
                        {Math.min(slideIndex, slides.length - 1) + 1} / {slides.length}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-[160px] items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-6 text-center text-sm text-navy-light/50">
                Your preview will appear here after you look something up.
              </div>
            )}

            <p className="mt-4 text-xs text-navy-light/60">
              Keys: Ctrl+Enter shows, Esc blanks the screen, Left and Right arrows move between slides.
            </p>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/40 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1 text-xs text-navy-light">
            <div className="truncate">
              <span className="font-semibold text-navy">On screen now:</span> {onScreenLabel}
            </div>
            {status && <div className="truncate text-navy-light/70">{status}</div>}
          </div>
          <button
            onClick={() => goTo(slideIndex - 1)}
            disabled={slides.length < 2 || slideIndex <= 0}
            className="rounded-lg border border-navy/20 px-4 py-3 text-sm font-semibold text-navy disabled:opacity-40"
          >
            ◀ Previous
          </button>
          <button
            onClick={showCurrent}
            disabled={!slide}
            className="rounded-lg bg-gold px-6 py-3 text-sm font-bold text-navy disabled:opacity-40"
          >
            {isLive ? "Update screen" : "Show on screen"}
          </button>
          <button
            onClick={() => goTo(slideIndex + 1)}
            disabled={slides.length < 2 || slideIndex >= slides.length - 1}
            className="rounded-lg border border-navy/20 px-4 py-3 text-sm font-semibold text-navy disabled:opacity-40"
          >
            Next ▶
          </button>
          <button onClick={blankScreen} className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            Blank
          </button>
        </div>
      </div>
    </main>
  );
}
