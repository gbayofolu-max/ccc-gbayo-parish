// Read-along engine. Pure functions, shared by the control page (listens) and the display page (draws).
// The two pages build the SAME word list from the same text, so a word number means the same thing on both.

export interface Token {
  text: string; // as displayed
  norm: string; // lower case, no accents or punctuation ("" = not matched against speech)
  line: number;
  verse: number | null;
  isNumber: boolean; // the verse number at the start of a line
}

export interface Lines {
  tokens: Token[];
  lines: { start: number; end: number }[]; // token range of each line (start === end: blank line)
}

export function normalizeWord(word: string): string {
  return word
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function buildLines(text: string, numbered: boolean): Lines {
  const tokens: Token[] = [];
  const lines: { start: number; end: number }[] = [];
  let verse: number | null = null;

  text.split("\n").forEach((line, lineIndex) => {
    const start = tokens.length;
    const parts = line.trim().split(/\s+/).filter(Boolean);

    parts.forEach((part, partIndex) => {
      const isNumber = numbered && partIndex === 0 && parts.length > 1 && /^\d{1,3}$/.test(part);
      if (isNumber) verse = parseInt(part, 10);
      tokens.push({ text: part, norm: isNumber ? "" : normalizeWord(part), line: lineIndex, verse, isNumber });
    });

    lines.push({ start, end: tokens.length });
  });

  return { tokens, lines };
}

// Both pages use this to confirm they are talking about the same passage.
export function textKey(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  return `${text.length}:${(hash >>> 0).toString(36)}`;
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

// Speech recognisers misspell: allow a small difference on longer words only.
function same(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 5 || b.length < 5 || Math.abs(a.length - b.length) > 1) return false;
  return levenshtein(a, b) <= (a.length >= 9 ? 2 : 1);
}

export interface AlignResult {
  index: number; // token index of the word the preacher has just read
  jumped: boolean; // true when the position moved far (he skipped, or went back)
}

export class Aligner {
  readonly tokens: Token[];
  private words: string[] = []; // normalised words that can be matched
  private map: number[] = []; // position in `words` -> token index
  private pm = -1; // position in `words` of the last word read
  private wordSet = new Set<string>();

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    tokens.forEach((t, i) => {
      if (t.norm) {
        this.words.push(t.norm);
        this.wordSet.add(t.norm);
        this.map.push(i);
      }
    });
  }

  get position(): number {
    return this.pm < 0 ? -1 : this.map[this.pm];
  }

  // Treat everything before this token as already read (used by "go back to verse 5").
  setBefore(tokenIndex: number): void {
    let count = 0;
    while (count < this.map.length && this.map[count] < tokenIndex) count++;
    this.pm = count - 1;
  }

  // How many words are still to be read (0 when the last word has been reached).
  remaining(): number {
    return this.words.length - 1 - this.pm;
  }

  // How much of what was heard is made of words found in this text (0 to 1). High means the person is reading what is on the screen.
  overlap(heard: string[]): number {
    const spoken = heard.map(normalizeWord).filter((w) => w.length >= 3);
    if (spoken.length < 3) return 0;
    let shared = 0;
    for (const w of spoken) if (this.wordSet.has(w)) shared++;
    return shared / spoken.length;
  }

  // The next few words the text expects, so a stray "wait" inside a verse is not mistaken for a command.
  upcoming(count = 3): string[] {
    return this.words.slice(this.pm + 1, this.pm + 1 + count);
  }

  private matchLength(spoken: string[], endS: number, e: number): { k: number; score: number } {
    let k = 0;
    let score = 0;
    while (k < 12 && endS - k >= 0 && e - k >= 0 && same(spoken[endS - k], this.words[e - k])) {
      score += Math.min(this.words[e - k].length, 8);
      k++;
    }
    return { k, score };
  }

  private accept(k: number, score: number, minK: number): boolean {
    return (k >= 2 && score >= 9 && k >= minK) || k >= Math.max(3, minK);
  }

  private search(spoken: string[], lo: number, hi: number, minK: number, near: number) {
    let best: { k: number; e: number; dist: number } | null = null;

    // The last spoken word of an unfinished sentence is often half-heard, so also try ending one word earlier.
    for (const endS of [spoken.length - 1, spoken.length - 2]) {
      if (endS < 0) continue;
      for (let e = lo; e <= hi; e++) {
        const { k, score } = this.matchLength(spoken, endS, e);
        if (!this.accept(k, score, minK)) continue;
        const dist = Math.abs(e - near);
        const lastWord = endS === spoken.length - 1;
        // Ending one word early only wins when it matches clearly more than the full ending does.
        if (!best || k > best.k + (lastWord ? 0 : 1) || (lastWord && k === best.k && dist < best.dist)) best = { k, e, dist };
      }
    }
    return best;
  }

  // Give it the words just heard (a recogniser's running text). Returns the new position, or null when nothing matched.
  feed(heard: string[]): AlignResult | null {
    if (this.words.length === 0) return null;
    const spoken = heard.map(normalizeWord).filter(Boolean).slice(-16);
    if (spoken.length === 0) return null;

    const last = this.words.length - 1;
    const near = this.pm + 1;

    // 1) Normal reading: the next words after where we were.
    let best = this.search(spoken, Math.max(0, this.pm - 3), Math.min(last, this.pm + 45), 2, near);

    // 2) One distinctive word right after the last position keeps things moving when the speech is patchy.
    if (!best && spoken.length >= 1) {
      const w = spoken[spoken.length - 1];
      for (let e = Math.max(0, this.pm + 1); e <= Math.min(last, this.pm + 6); e++) {
        if (w.length >= 6 && same(w, this.words[e])) {
          best = { k: 1, e, dist: e - near };
          break;
        }
      }
    }

    // 3) Lost (he skipped ahead or went back): only a long, clear match anywhere in the passage re-anchors us.
    if (!best && spoken.length >= 4) best = this.search(spoken, 0, last, 4, near);

    if (!best) return null;

    const jumped = best.e < this.pm - 3 || best.e > this.pm + 12;
    if (best.e === this.pm) return null;
    this.pm = best.e;
    return { index: this.map[this.pm], jumped };
  }
}
