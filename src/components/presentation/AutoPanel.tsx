"use client";

import { useState } from "react";
import type { AutoModeApi } from "@/lib/voice/useAutoMode";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-navy placeholder:text-gray-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-light/70";
const btn = "rounded-lg border border-navy/20 bg-white px-3 py-2 text-sm font-semibold text-navy disabled:opacity-40";

export default function AutoPanel({ voice }: { voice: AutoModeApi }) {
  const [verseBox, setVerseBox] = useState("");
  const r = voice.reading;

  return (
    <div className="mb-6 rounded-2xl border border-gold/50 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl font-bold text-navy">Auto mode (voice)</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                voice.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-navy-light"
              }`}
            >
              {voice.enabled ? (voice.paused ? "AUTO · PAUSED" : "AUTO") : "MANUAL"}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                voice.projectors > 0 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
              }`}
              title="Open /presentation on the projector phone and tap it once"
            >
              {voice.projectors > 0 ? `Projector connected${voice.projectors > 1 ? ` (${voice.projectors})` : ""}` : "No projector connected"}
            </span>
          </div>
          <p className="text-xs text-navy-light/60">
            Say a reference such as &ldquo;Genesis chapter 3 verse 1&rdquo; or &ldquo;hymn number 5 from our hymn book&rdquo; and it goes on the
            screen. While it is showing, the screen follows the reading. Say &ldquo;wait&rdquo; to hold it, &ldquo;continue&rdquo; to go on,
            &ldquo;go back to verse 5&rdquo;, &ldquo;scroll down&rdquo;, &ldquo;scroll to the top&rdquo;, or add &ldquo;in Yoruba&rdquo; after a verse.
          </p>
        </div>
        {voice.supported ? (
          <button
            onClick={voice.toggle}
            className={`rounded-lg px-5 py-3 text-sm font-bold ${voice.enabled ? "bg-red-600 text-white" : "bg-navy text-gold"}`}
          >
            {voice.enabled ? "Auto mode ON: tap to go back to manual" : "Turn Auto mode on"}
          </button>
        ) : (
          <p className="text-sm text-red-600">This browser cannot listen. Use Google Chrome on a laptop or an Android phone.</p>
        )}
      </div>

      {voice.enabled && (
        <div className="mt-3 flex items-center gap-2 text-sm text-navy">
          <span className={`inline-block h-3 w-3 shrink-0 rounded-full ${voice.listening ? "animate-pulse bg-green-500" : "bg-amber-400"}`} />
          <span className="shrink-0">{voice.listening ? "Listening..." : "Starting the microphone..."}</span>
          {voice.heard && <span className="truncate italic text-navy-light/70">&ldquo;{voice.heard}&rdquo;</span>}
          {voice.gate !== "off" && (
            <span className="ml-auto h-2 w-24 shrink-0 overflow-hidden rounded-full bg-gray-200" title="Microphone level">
              <span className="block h-full bg-green-500" style={{ width: `${Math.round(voice.level * 100)}%` }} />
            </span>
          )}
        </div>
      )}

      {voice.error && <p className="mt-2 text-sm text-red-600">{voice.error}</p>}

      {voice.pending && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-gold bg-gold/10 px-4 py-3">
          <span className="text-sm font-semibold text-navy">
            Heard {voice.pending.label}. Showing in {voice.pending.secondsLeft}...
          </span>
          <button onClick={voice.cancelPending} className="rounded-lg border border-red-300 bg-white px-3 py-1 text-sm font-semibold text-red-700">
            Cancel
          </button>
        </div>
      )}

      {voice.suggestions.length > 0 && (
        <div className="mt-3 rounded-lg border border-gold bg-gold/10 px-4 py-3">
          <p className="text-sm font-semibold text-navy">It sounded like a quote. Tap the right one to show it:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {voice.suggestions.map((s) => (
              <button key={s.id} onClick={() => voice.acceptSuggestion(s.id)} className="rounded-lg bg-navy px-4 py-2 text-sm font-bold text-gold">
                {s.label}
              </button>
            ))}
            <button onClick={voice.dismissSuggestions} className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700">
              Not these
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl bg-gray-50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-navy-light/70">Reading</span>
          <span className="text-sm font-semibold text-navy">
            {r.word < 0 ? "Waiting for the preacher to start reading" : r.verse ? `Verse ${r.verse}` : `Word ${r.word + 1} of ${r.total}`}
          </span>
          <label className="ml-auto flex items-center gap-2 text-sm text-navy">
            <input type="checkbox" checked={voice.follow} onChange={(e) => voice.setFollow(e.target.checked)} className="h-4 w-4 accent-navy" />
            Follow the reading
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button className={btn} onClick={voice.paused ? voice.resume : voice.pause}>
            {voice.paused ? "▶ Continue" : "❚❚ Hold"}
          </button>
          <button className={btn} onClick={() => voice.scrollBy(-1)}>
            ▲ Scroll up
          </button>
          <button className={btn} onClick={() => voice.scrollBy(1)}>
            ▼ Scroll down
          </button>
          <div className="flex items-center gap-2">
            <input
              className={`${inputClass} w-28`}
              placeholder="Verse no."
              inputMode="numeric"
              value={verseBox}
              onChange={(e) => setVerseBox(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && verseBox) voice.gotoVerse(parseInt(verseBox, 10));
              }}
            />
            <button className={btn} disabled={!verseBox} onClick={() => voice.gotoVerse(parseInt(verseBox, 10))}>
              Go to verse
            </button>
          </div>
        </div>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-navy">Settings and what it heard</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass}>Wait before showing</label>
            <select className={inputClass} value={voice.delaySeconds} onChange={(e) => voice.setDelaySeconds(Number(e.target.value))}>
              <option value={0}>Show immediately</option>
              <option value={1}>1 second (you can cancel)</option>
              <option value={2}>2 seconds (you can cancel)</option>
              <option value={3}>3 seconds (you can cancel)</option>
              <option value={5}>5 seconds (you can cancel)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Listening language</label>
            <select className={inputClass} value={voice.accent} onChange={(e) => voice.setAccent(e.target.value)}>
              <option value="en-NG">Nigerian English</option>
              <option value="en-GB">British English</option>
              <option value="en-US">American English</option>
              <option value="yo-NG">Yorùbá (try it, Chrome may not support it)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Ignore quiet voices</label>
            <select className={inputClass} value={voice.gate} onChange={(e) => voice.setGate(e.target.value)}>
              <option value="off">Off</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High (only a loud microphone)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Scroll after reading</label>
            <select className={inputClass} value={voice.stepLines} onChange={(e) => voice.setStepLines(Number(e.target.value))}>
              <option value={1}>every line</option>
              <option value={2}>every 2 lines</option>
              <option value={3}>every 3 lines</option>
              <option value={4}>every 4 lines</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Timed scrolling (for singing)</label>
            <select className={inputClass} value={voice.pace} onChange={(e) => voice.setPace(Number(e.target.value))}>
              <option value={0}>Off (follow the voice)</option>
              <option value={4}>every 4 seconds</option>
              <option value={6}>every 6 seconds</option>
              <option value={8}>every 8 seconds</option>
              <option value={10}>every 10 seconds</option>
              <option value={15}>every 15 seconds</option>
              <option value={20}>every 20 seconds</option>
            </select>
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-navy">
            <input type="checkbox" checked={voice.hymnInstant} onChange={(e) => voice.setHymnInstant(e.target.checked)} className="mb-1 h-4 w-4 accent-navy" />
            <span>Show a hymn the moment its number is said (it stays until another hymn number is said)</span>
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm text-navy">
            <input type="checkbox" checked={voice.quotes} onChange={(e) => voice.setQuotes(e.target.checked)} className="mb-1 h-4 w-4 accent-navy" />
            <span>Recognise a quoted verse or sung hymn line even when no number or reference is said</span>
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm text-navy">
            <input type="checkbox" checked={voice.ai} onChange={(e) => voice.setAi(e.target.checked)} className="mb-1 h-4 w-4 accent-navy" />
            <span>Smart understanding (AI): reads short sentences the fixed rules miss, e.g. &ldquo;take us to the hymn book, one seventy six&rdquo;</span>
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm text-navy">
            <input type="checkbox" checked={voice.navigation} onChange={(e) => voice.setNavigation(e.target.checked)} className="mb-1 h-4 w-4 accent-navy" />
            <span>Also obey &ldquo;next verse&rdquo;, &ldquo;clear the screen&rdquo;, &ldquo;go back to verse 5&rdquo;, &ldquo;in Yoruba&rdquo; (scroll, wait and continue always work)</span>
          </label>
        </div>

        <ul className="mt-4 space-y-1 text-xs text-navy">
          {voice.log.length === 0 && <li className="text-navy-light/60">Nothing yet. Commands it recognises will be listed here.</li>}
          {voice.log.map((entry) => (
            <li key={entry.id} className="flex gap-2">
              <span className="shrink-0 text-navy-light/60">{entry.time}</span>
              <span className="truncate">&ldquo;{entry.heard}&rdquo;</span>
              <span className="ml-auto shrink-0 font-semibold">{entry.outcome}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-navy-light/60">
          The microphone audio is turned into text by Chrome&apos;s own speech service. This website does not record or keep the speech: it only
          acts on a clear reference or on words it can match to the passage on the screen.
        </p>
      </details>
    </div>
  );
}
