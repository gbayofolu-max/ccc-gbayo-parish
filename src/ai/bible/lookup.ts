import { supabaseAdmin } from "@/lib/supabase/server";

export const BOOK_ORDER = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
  "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon",
  "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians",
  "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter",
  "1 John", "2 John", "3 John", "Jude", "Revelation",
];

export const BOOK_ALIASES: Record<string, string> = {
  "gen": "Genesis", "exo": "Exodus", "exod": "Exodus", "lev": "Leviticus", "num": "Numbers",
  "deut": "Deuteronomy", "deu": "Deuteronomy", "josh": "Joshua", "jos": "Joshua",
  "judg": "Judges", "jdg": "Judges",
  "1 sam": "1 Samuel", "2 sam": "2 Samuel", "1 kgs": "1 Kings", "1 ki": "1 Kings",
  "2 kgs": "2 Kings", "2 ki": "2 Kings", "1 chr": "1 Chronicles", "2 chr": "2 Chronicles",
  "ps": "Psalms", "psa": "Psalms", "psalm": "Psalms",
  "prov": "Proverbs", "pro": "Proverbs",
  "eccl": "Ecclesiastes", "eccles": "Ecclesiastes",
  "song": "Song of Solomon", "sos": "Song of Solomon",
  "isa": "Isaiah", "jer": "Jeremiah", "lam": "Lamentations",
  "ezek": "Ezekiel", "eze": "Ezekiel", "dan": "Daniel", "hos": "Hosea",
  "obad": "Obadiah", "oba": "Obadiah", "jon": "Jonah", "mic": "Micah", "nah": "Nahum",
  "hab": "Habakkuk", "zeph": "Zephaniah", "zep": "Zephaniah",
  "hag": "Haggai", "zech": "Zechariah", "zec": "Zechariah", "mal": "Malachi",
  "matt": "Matthew", "mat": "Matthew", "mk": "Mark", "mar": "Mark",
  "lk": "Luke", "luk": "Luke", "jn": "John", "joh": "John",
  "ac": "Acts", "act": "Acts", "rom": "Romans",
  "1 cor": "1 Corinthians", "2 cor": "2 Corinthians",
  "gal": "Galatians", "eph": "Ephesians", "phil": "Philippians", "php": "Philippians",
  "col": "Colossians", "1 thess": "1 Thessalonians", "2 thess": "2 Thessalonians",
  "1 tim": "1 Timothy", "2 tim": "2 Timothy", "tit": "Titus",
  "phlm": "Philemon", "phm": "Philemon", "heb": "Hebrews", "jas": "James",
  "1 pet": "1 Peter", "2 pet": "2 Peter", "1 jn": "1 John", "2 jn": "2 John", "3 jn": "3 John",
  "rev": "Revelation",
};

export function resolveBookName(raw: string): string | null {
  const lower = raw.toLowerCase().replace(/\.$/, "").trim();
  if (BOOK_ALIASES[lower]) return BOOK_ALIASES[lower];
  const exact = BOOK_ORDER.find((b) => b.toLowerCase() === lower);
  return exact ?? null;
}

export interface VerseRow {
  verse: number;
  text: string;
}

export interface VerseLookupResult {
  content: string;
  reference: string;
  source: string;
  verses: VerseRow[];
}

// Fetches every verse for a given book+chapter from one Bible source,
// then filters/sorts client-side. Chapters are small (max 176 verses,
// Psalm 119), so this is cheap even without a dedicated index.
//
// Returns both a combined `content` string (for places that just want
// plain text) AND a `verses` array of individual {verse, text} rows —
// the control panel uses the array to paginate long passages into
// legible chunks instead of cramming a whole chapter onto one screen.
export async function fetchVersesFromSource(
  source: string,
  book: string,
  chapter: number,
  verseStart?: number,
  verseEnd?: number
): Promise<VerseLookupResult | null> {
  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("content, reference, metadata")
    .eq("category", "scripture")
    .eq("source", source)
    .eq("metadata->>book", book)
    .eq("metadata->>chapter", String(chapter));

  if (error || !data || data.length === 0) return null;

  let rows = data as { content: string; reference: string; metadata: any }[];
  rows.sort((a, b) => (a.metadata?.verse ?? 0) - (b.metadata?.verse ?? 0));

  if (verseStart) {
    const end = verseEnd ?? verseStart;
    rows = rows.filter((r) => {
      const v = r.metadata?.verse ?? 0;
      return v >= verseStart && v <= end;
    });
  } else if (rows.length > 176) {
    rows = rows.slice(0, 176);
  }

  if (rows.length === 0) return null;

  const verses: VerseRow[] = rows.map((r) => ({
    verse: r.metadata?.verse ?? 0,
    text: r.content,
  }));

  const combinedText = verses.map((v) => `${v.verse}. ${v.text}`).join(" ");
  const refLabel =
    verseStart && verseEnd && verseStart !== verseEnd
      ? `${book} ${chapter}:${verseStart}-${verseEnd}`
      : verseStart
      ? `${book} ${chapter}:${verseStart}`
      : `${book} ${chapter}`;

  return { content: combinedText, reference: refLabel, source, verses };
}
