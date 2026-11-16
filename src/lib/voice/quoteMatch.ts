// Works out which hymn or Bible verse a spoken or sung sentence is quoting. Pure functions: no network, no browser.

const ENGLISH_WORDS = new Set(["the", "and", "of", "to", "in", "that", "he", "his", "for", "is", "unto", "shall", "thou", "thee", "hath", "not", "with", "him", "they", "was", "be", "it", "all"]);

export function words(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !/^\d+$/.test(w)); // stanza and verse numbers are not part of what is sung or said
}

// ---------------------------------------------------------------- hymns
export interface HymnRow {
  reference: string; // "Hymn 214"
  yoruba?: string | null;
  english?: string | null;
}

export interface HymnIndex {
  grams: Map<string, number[]>; // three words in a row -> the hymn/language entries containing them
  items: { number: string; language: "yoruba" | "english" }[];
}

export function buildHymnIndex(rows: HymnRow[]): HymnIndex {
  const grams = new Map<string, number[]>();
  const items: HymnIndex["items"] = [];

  for (const row of rows) {
    const number = /(\d+)/.exec(row.reference ?? "")?.[1];
    if (!number) continue;
    for (const language of ["yoruba", "english"] as const) {
      const text = row[language];
      if (!text) continue;
      const w = words(text);
      if (w.length < 3) continue;
      const id = items.push({ number, language }) - 1;
      const seen = new Set<string>();
      for (let i = 0; i + 2 < w.length; i++) {
        const gram = `${w[i]} ${w[i + 1]} ${w[i + 2]}`;
        if (seen.has(gram)) continue;
        seen.add(gram);
        const list = grams.get(gram);
        if (list) list.push(id);
        else grams.set(gram, [id]);
      }
    }
  }
  return { grams, items };
}

export interface HymnMatch {
  number: string;
  language: "yoruba" | "english";
  coverage: number; // share of what was heard that is found in the hymn
  clear: boolean; // no other hymn matches nearly as well
  others: string[]; // other hymn numbers that matched
}

export function matchHymn(index: HymnIndex, spoken: string): HymnMatch | null {
  const w = words(spoken);
  if (w.length < 4) return null;

  const hits = new Map<number, number>();
  const seen = new Set<string>();
  for (let i = 0; i + 2 < w.length; i++) {
    const gram = `${w[i]} ${w[i + 1]} ${w[i + 2]}`;
    if (seen.has(gram)) continue;
    seen.add(gram);
    for (const id of index.grams.get(gram) ?? []) hits.set(id, (hits.get(id) ?? 0) + 1);
  }

  const perHymn = new Map<string, { count: number; language: "yoruba" | "english" }>();
  for (const [id, count] of hits) {
    const item = index.items[id];
    const current = perHymn.get(item.number);
    if (!current || count > current.count) perHymn.set(item.number, { count, language: item.language });
  }

  const ranked = [...perHymn.entries()].sort((a, b) => b[1].count - a[1].count);
  const best = ranked[0];
  if (!best) return null;

  const coverage = best[1].count / Math.max(1, seen.size);
  if (best[1].count < 2 || coverage < 0.5) return null;

  const second = ranked[1];
  return {
    number: best[0],
    language: best[1].language,
    coverage,
    clear: !second || second[1].count <= best[1].count * 0.7,
    others: ranked.slice(1, 3).map(([n]) => n),
  };
}

// ---------------------------------------------------------------- Bible verses
export interface VerseRow {
  reference?: string | null; // "John 3:16"
  content?: string | null;
  similarity?: number | null;
  metadata?: any;
}

export interface VerseMatch {
  book: string;
  chapter: string;
  verse: string;
  language: "english" | "yoruba";
  label: string;
  overlap: number;
  similarity: number;
}

function languageOf(row: VerseRow): "english" | "yoruba" {
  const tag = String(row.metadata?.language ?? row.metadata?.lang ?? "").toLowerCase();
  if (tag.includes("yoruba") || tag === "yo") return "yoruba";
  if (tag.includes("english") || tag === "en") return "english";
  const w = words(row.content ?? "");
  const english = w.filter((x) => ENGLISH_WORDS.has(x)).length;
  return english / Math.max(1, w.length) >= 0.15 ? "english" : "yoruba";
}

// The search finds verses that mean something similar; the word overlap decides whether it is really that verse.
export function rankVerses(spoken: string, rows: VerseRow[]): { best: VerseMatch | null; high: boolean; maybe: VerseMatch[] } {
  const heard = new Set(words(spoken).filter((x) => x.length >= 3));
  if (heard.size < 3) return { best: null, high: false, maybe: [] };

  const found: VerseMatch[] = [];
  const keys = new Set<string>();
  for (const row of rows) {
    const m = /^(.+?)\s+(\d{1,3}):(\d{1,3})/.exec(String(row.reference ?? "").trim());
    if (!m || !row.content) continue;
    const verseWords = new Set(words(row.content));
    let shared = 0;
    heard.forEach((x) => {
      if (verseWords.has(x)) shared++;
    });
    const language = languageOf(row);
    const key = `${m[1]} ${m[2]}:${m[3]} ${language}`;
    if (keys.has(key)) continue;
    keys.add(key);
    found.push({
      book: m[1],
      chapter: m[2],
      verse: m[3],
      language,
      label: `${m[1]} ${m[2]}:${m[3]}`,
      overlap: shared / heard.size,
      similarity: Number(row.similarity ?? 0),
    });
  }

  found.sort((a, b) => b.overlap - a.overlap || b.similarity - a.similarity);
  const best = found[0] ?? null;
  if (!best) return { best: null, high: false, maybe: [] };

  const second = found.find((f) => f.label !== best.label);
  const high = best.overlap >= 0.6 && best.similarity >= 0.6 && (!second || best.overlap - second.overlap >= 0.15);
  // A suggestion needs real shared words: similarity of meaning alone is not enough to interrupt the operator.
  const maybe = found.filter((f) => f.overlap >= 0.35 || (f.similarity >= 0.85 && f.overlap >= 0.2)).slice(0, 3);
  return { best, high, maybe };
}
