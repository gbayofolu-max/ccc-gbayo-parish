"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties } from "react";
import { buildLines, type Lines } from "@/lib/voice/readAlong";

// One drawing of the projector screen, used by BOTH the real projector page and the preview on the control page,
// so what you see in the preview is what the congregation sees, and both scroll the same way.
//  - Long text keeps the size you chose and scrolls.
//  - The word being read is highlighted; after every N lines are read the screen moves on by N lines.
//  - Yoruba and English can sit side by side, row by row (a line holding only "‖" separates the two columns).

export const COLUMN_MARK = "‖";
const MANUAL_HOLD_MS = 12000; // after you scroll by hand, automatic scrolling waits this long

export interface ScreenCommand {
  nonce: number;
  kind: "by" | "to" | "lines" | "ratio" | "word";
  dir?: 1 | -1;
  amount?: "small" | "normal" | "large";
  to?: "top" | "bottom";
  lines?: number;
  ratio?: number;
  word?: number; // put this word at the top of the screen
}

export interface ProjectorScreenProps {
  width: number;
  height: number;
  title: string | null;
  text: string;
  numbered: boolean;
  language: string | null;
  fontFamily: string | null;
  fontSize: string | null;
  lineSpacing: string | null;
  autoFit: boolean;
  pos: number; // word being read (-1: nothing yet)
  step: number; // lines per scroll step
  command: ScreenCommand | null;
  onUserScroll?: (ratio: number, topWord?: number) => void; // the person scrolled this screen by hand (and which word is now at the top)
  onOverflow?: (overflow: boolean) => void;
}

function family(f: string | null): string {
  switch (f) {
    case "modern":
      return "Arial, Helvetica, sans-serif";
    case "humanist":
      return '"Trebuchet MS", Arial, sans-serif';
    case "readable":
      return "Verdana, Geneva, sans-serif";
    default:
      return 'Georgia, "Times New Roman", serif';
  }
}

function sizeVw(s: string | null): number {
  switch (s) {
    case "compact":
      return 3.125;
    case "standard":
      return 3.75;
    case "large":
      return 5;
    case "giant":
      return 6.67;
    default:
      return 5.5;
  }
}

function leading(s: string | null): number {
  return s === "tight" ? 1.25 : s === "spacious" ? 2 : 1.375;
}

type Item = { type: "spacer" } | { type: "lines"; lines: number[] } | { type: "cols"; left: number[]; right: number[] };

function layout(p: Lines): Item[] {
  const items: Item[] = [];
  let block: number[] = [];
  const flush = () => {
    if (block.length === 0) return;
    const mark = block.findIndex((li) => {
      const l = p.lines[li];
      return l.end - l.start === 1 && p.tokens[l.start].text === COLUMN_MARK;
    });
    if (mark >= 0) items.push({ type: "cols", left: block.slice(0, mark), right: block.slice(mark + 1) });
    else items.push({ type: "lines", lines: block });
    block = [];
  };
  p.lines.forEach((l, li) => {
    if (l.start === l.end) {
      flush();
      items.push({ type: "spacer" });
    } else block.push(li);
  });
  flush();
  return items;
}

export default function ProjectorScreen(props: ProjectorScreenProps) {
  const { width, height, title, text, numbered, language, step, command } = props;

  // When a new passage appears, the reading position still held by the page that sent it belongs to the OLD passage.
  // Ignore that one value, so the new passage always starts at its beginning with nothing marked as read.
  const stalePos = useRef<{ text: string; pos: number } | null>(null);
  if (stalePos.current === null || stalePos.current.text !== text) stalePos.current = { text, pos: props.pos };
  if (props.pos !== stalePos.current.pos) stalePos.current.pos = Number.NaN; // replaced by a fresh position: from here on every position counts
  const pos = props.pos === stalePos.current.pos ? -1 : props.pos;
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Record<number, HTMLElement | null>>({});
  const lastBlock = useRef(-1);
  const manualUntil = useRef(0);
  const programmaticUntil = useRef(0);
  const touching = useRef(false);
  const touchEndAt = useRef(0);
  const lastRatioAt = useRef(0);
  const trailing = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onOverflowRef = useRef(props.onOverflow);
  onOverflowRef.current = props.onOverflow;
  const onUserScrollRef = useRef(props.onUserScroll);
  onUserScrollRef.current = props.onUserScroll;

  const parsed = useMemo(() => buildLines(text, numbered), [text, numbered]);
  const items = useMemo(() => layout(parsed), [parsed]);
  const hasColumns = items.some((i) => i.type === "cols");
  const base = ((Math.min(width, (height * 16) / 9) * sizeVw(props.fontSize)) / 100) * (hasColumns ? 0.8 : 1);
  const leadingValue = leading(props.lineSpacing);

  // Text keeps the size that was chosen. Auto-fit may trim it a little (never below 70%) when that makes a short text fit;
  // anything longer stays at full size and scrolls instead of shrinking into small print.
  useLayoutEffect(() => {
    const el = textRef.current;
    const box = boxRef.current;
    if (!el || !box) return;
    el.style.fontSize = `${base}px`;
    const room = box.clientHeight - (language && !hasColumns ? width * 0.06 : 0);
    if (props.autoFit && el.scrollHeight > room) {
      let fitted = false;
      for (let s = 0.95; s >= 0.7; s -= 0.05) {
        el.style.fontSize = `${base * s}px`;
        if (el.scrollHeight <= room) {
          fitted = true;
          break;
        }
      }
      if (!fitted) el.style.fontSize = `${base}px`;
    }
    onOverflowRef.current?.(el.scrollHeight > room + 2);
  }, [text, numbered, base, props.autoFit, leadingValue, props.fontFamily, title, language, width, height, hasColumns]);

  // A new passage starts at the top with nothing marked as read.
  useEffect(() => {
    lastBlock.current = -1;
    manualUntil.current = 0;
    programmaticUntil.current = Date.now() + 400;
    boxRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [text, numbered]);

  // Follow the reading: when the reader reaches a new block of `step` lines, move on by that many lines.
  useEffect(() => {
    if (pos < 0) {
      lastBlock.current = -1;
      return;
    }
    const box = boxRef.current;
    const el = textRef.current;
    const word = wordRefs.current[pos];
    if (!box || !el || !word || Date.now() < manualUntil.current) return;

    const lh = (parseFloat(el.style.fontSize) || base) * leadingValue;
    const y = el.offsetTop + word.offsetTop;
    const lineNo = Math.round(word.offsetTop / lh);
    const block = Math.floor(lineNo / Math.max(1, step));
    const outOfView = y < box.scrollTop || y > box.scrollTop + box.clientHeight - lh;

    if (block === lastBlock.current && !outOfView) return;
    lastBlock.current = block;

    // Keep one line that has already been read above the new block.
    const target = block === 0 ? 0 : Math.max(0, el.offsetTop + block * Math.max(1, step) * lh - lh * 1.05);
    programmaticUntil.current = Date.now() + 900;
    box.scrollTo({ top: target, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, step, text]);

  // Scroll commands: buttons, voice, timed scrolling, or the control page's preview being scrolled by hand.
  useEffect(() => {
    if (!command) return;
    const box = boxRef.current;
    const el = textRef.current;
    if (!box) return;
    programmaticUntil.current = Date.now() + 900;
    const lh = ((el && parseFloat(el.style.fontSize)) || base) * leadingValue;

    if (command.kind === "word") {
      // Exact sync with the control page's preview: the same word goes to the top of this screen.
      manualUntil.current = Date.now() + MANUAL_HOLD_MS;
      const target = command.word !== undefined ? wordRefs.current[command.word] : null;
      if (target && el) {
        box.scrollTo({ top: Math.max(0, el.offsetTop + target.offsetTop - 2), behavior: "auto" });
      } else {
        const max = box.scrollHeight - box.clientHeight;
        box.scrollTo({ top: Math.max(0, Math.min(1, command.ratio ?? 0)) * max, behavior: "auto" });
      }
    } else if (command.kind === "ratio") {
      manualUntil.current = Date.now() + MANUAL_HOLD_MS;
      const max = box.scrollHeight - box.clientHeight;
      box.scrollTo({ top: Math.max(0, Math.min(1, command.ratio ?? 0)) * max, behavior: "auto" });
    } else if (command.kind === "lines") {
      box.scrollBy({ top: (command.lines ?? 2) * lh, behavior: "smooth" });
    } else if (command.kind === "to") {
      manualUntil.current = Date.now() + MANUAL_HOLD_MS;
      box.scrollTo({ top: command.to === "bottom" ? box.scrollHeight : 0, behavior: "smooth" });
    } else {
      manualUntil.current = Date.now() + MANUAL_HOLD_MS;
      const share = command.amount === "small" ? 0.2 : command.amount === "large" ? 0.9 : 0.5;
      box.scrollBy({ top: (command.dir === -1 ? -1 : 1) * box.clientHeight * share, behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command?.nonce]);

  function handleScroll() {
    const box = boxRef.current;
    const cb = onUserScrollRef.current;
    if (!box || !cb) return;
    // Anything that is not this screen's own automatic scrolling is the person scrolling by hand.
    if (Date.now() < programmaticUntil.current) return;

    manualUntil.current = Date.now() + MANUAL_HOLD_MS;
    const send = () => {
      const max = box.scrollHeight - box.clientHeight;
      const el = textRef.current;
      let topWord = -1;
      if (el) {
        const top = box.scrollTop - el.offsetTop - 2;
        for (let i = 0; i < parsed.tokens.length; i++) {
          const w = wordRefs.current[i];
          if (w && w.offsetTop >= top) {
            topWord = i;
            break;
          }
        }
      }
      cb(max > 0 ? box.scrollTop / max : 0, topWord >= 0 ? topWord : undefined);
    };
    const now = Date.now();
    if (trailing.current) clearTimeout(trailing.current);
    trailing.current = setTimeout(send, 90); // the last position always gets through
    if (now - lastRatioAt.current >= 60) {
      lastRatioAt.current = now;
      send();
    }
  }

  const hand = {
    onTouchStart: () => {
      touching.current = true;
    },
    onTouchEnd: () => {
      touching.current = false;
      touchEndAt.current = Date.now();
    },
    onTouchCancel: () => {
      touching.current = false;
      touchEndAt.current = Date.now();
    },
    onMouseDown: () => {
      touching.current = true;
    },
    onMouseUp: () => {
      touching.current = false;
      touchEndAt.current = Date.now();
    },
    onWheel: () => {
      touchEndAt.current = Date.now();
    },
  };

  const following = pos >= 0;
  function wordStyle(index: number, isNumber: boolean): CSSProperties {
    if (isNumber) return { color: "#d4af37", fontWeight: 700, opacity: following && index < pos ? 0.6 : 1 };
    if (!following) return {};
    if (index === pos) return { backgroundColor: "rgba(212,175,55,0.45)", borderRadius: "0.2em", padding: "0 0.08em" };
    if (index < pos) return { opacity: 0.5 };
    return {};
  }

  function renderLine(li: number) {
    const ln = parsed.lines[li];
    return (
      <div key={li}>
        {parsed.tokens.slice(ln.start, ln.end).map((token, offset) => {
          const index = ln.start + offset;
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
    );
  }

  const labelStyle: CSSProperties = { fontSize: width * 0.016, letterSpacing: "0.3em" };

  return (
    <div
      className="flex flex-col overflow-hidden bg-navy text-center"
      style={{ width, height, padding: `${height * 0.05}px ${width * 0.05}px`, boxSizing: "border-box" }}
    >
      {title && (
        <div className="shrink-0 font-serif font-bold text-gold" style={{ fontSize: width * 0.03, marginBottom: width * 0.01 }}>
          {title}
        </div>
      )}

      {hasColumns && (
        <div className="grid shrink-0 grid-cols-2 font-sans uppercase text-gold/70" style={{ ...labelStyle, columnGap: "2.5em", marginBottom: width * 0.008 }}>
          <div>Yorùbá</div>
          <div>English</div>
        </div>
      )}

      <div
        ref={boxRef}
        data-scrollbox="true"
        className="relative min-h-0 w-full flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none", touchAction: "pan-y", overscrollBehavior: "contain" }}
        onScroll={handleScroll}
        {...hand}
      >
        <div className="mx-auto flex min-h-full w-full flex-col items-center justify-center">
          {text && (
            <div
              ref={textRef}
              className="relative w-full text-white"
              style={{ fontFamily: family(props.fontFamily), lineHeight: leadingValue, fontSize: base, textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
            >
              {items.map((item, i) => {
                if (item.type === "spacer") return <div key={i} style={{ height: "0.7em" }} />;
                if (item.type === "lines") return <div key={i}>{item.lines.map(renderLine)}</div>;
                return (
                  <div key={i} className="grid" style={{ gridTemplateColumns: "1fr 1fr", columnGap: "2.5em" }}>
                    <div>{item.left.map(renderLine)}</div>
                    <div style={{ borderLeft: "2px solid rgba(212,175,55,0.35)", paddingLeft: "1.2em" }}>{item.right.map(renderLine)}</div>
                  </div>
                );
              })}
            </div>
          )}

          {language && !hasColumns && (
            <div className="font-sans uppercase text-gold/70" style={{ marginTop: width * 0.02, fontSize: width * 0.0187, letterSpacing: "0.3em" }}>
              {language}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
