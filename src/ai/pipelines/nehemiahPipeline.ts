import { createEmbedding } from "@/ai/embeddings/jina";
import { searchDocuments } from "@/ai/search/search";
import { createSystemPrompt } from "@/ai/prompts/systemPrompt";
import { askCerebras } from "@/ai/llm/cerebras";
import { askGroq } from "@/ai/llm/groq";
import { askGemini } from "@/ai/llm/gemini";
import { logPipelineRun } from "@/ai/observability/logger";
import { supabaseAdmin } from "@/lib/supabase/server";


interface NehemiahPipelineInput {
  question: string;
}


async function tryExactHymnLookup(question: string) {
  const match = question.match(/\bhymn\s*#?\s*(\d{1,4})\b/i);
  if (!match) return null;

  const hymnNumber = parseInt(match[1], 10);

  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("content, reference")
    .eq("category", "hymn")
    .eq("reference", `Hymn ${hymnNumber}`)
    .maybeSingle();

  if (error || !data) return null;

  return {
    hymnNumber,
    documents: [{ content: data.content, reference: data.reference, source: "Hymn Book" }],
  };
}


const BOOK_ORDER = [
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

const BOOK_ALIASES: Record<string, string> = {
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

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const ALL_BOOK_NAMES = Array.from(
  new Set([...BOOK_ORDER.map((b) => b.toLowerCase()), ...Object.keys(BOOK_ALIASES)])
).sort((a, b) => b.length - a.length);

// Matches: "John 3:16", "John 3 vs 16", "John 3 v 16", "John chapter 3 verse 16",
// "Mark 12 vs 30,31", "Genesis 1:1-5", "Mark 12:30 and 31" — the verse part
// (group 3) is deliberately loose; we parse the actual numbers out of it
// afterward rather than trying to encode every phrasing in the regex itself.
const VERSE_REGEX = new RegExp(
  `\\b(${ALL_BOOK_NAMES.map(escapeRegex).join("|")})\\.?\\s+(?:chapter\\s+)?(\\d{1,3})` +
  `(?:\\s*(?:\\bverses?\\b|\\bvs\\.?\\b|\\bv\\.?\\b|[:,])\\s*` +
  `(\\d{1,3}(?:\\s*(?:,|-|and|to)\\s*\\d{1,3})*))?`,
  "i"
);

function resolveBookName(raw: string): string | null {
  const lower = raw.toLowerCase().replace(/\.$/, "").trim();
  if (BOOK_ALIASES[lower]) return BOOK_ALIASES[lower];
  const exact = BOOK_ORDER.find((b) => b.toLowerCase() === lower);
  return exact ?? null;
}

async function fetchVersesFromSource(
  source: string,
  book: string,
  chapter: number,
  verseStart?: number,
  verseEnd?: number
): Promise<{ content: string; reference: string; source: string } | null> {
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
  } else if (rows.length > 40) {
    rows = rows.slice(0, 40);
  }

  if (rows.length === 0) return null;

  const combinedText = rows.map((r) => `${r.metadata?.verse}. ${r.content}`).join(" ");
  const refLabel =
    verseStart && verseEnd && verseStart !== verseEnd
      ? `${book} ${chapter}:${verseStart}-${verseEnd}`
      : verseStart
      ? `${book} ${chapter}:${verseStart}`
      : `${book} ${chapter}`;

  return { content: combinedText, reference: refLabel, source };
}

async function tryExactVerseLookup(question: string) {
  const match = VERSE_REGEX.exec(question);
  if (!match) return null;

  const book = resolveBookName(match[1]);
  if (!book) return null;

  const chapter = parseInt(match[2], 10);

  // Group 3 is the raw verse phrase — e.g. "16", "1-5", "30,31", "1 and 3".
  // Rather than encode every separator in the regex, pull every number out
  // of it and span from the smallest to the largest. "30,31" becomes the
  // range 30-31 (correct); "3,7" becomes 3-7 (a superset, but never wrong —
  // it just includes a bit more surrounding context, which is harmless).
  let verseStart: number | undefined;
  let verseEnd: number | undefined;

  if (match[3]) {
    const nums = Array.from(match[3].matchAll(/\d+/g)).map((m) => parseInt(m[0], 10));
    if (nums.length > 0) {
      verseStart = Math.min(...nums);
      verseEnd = Math.max(...nums);
    }
  }

  const [kjv, yoruba] = await Promise.all([
    fetchVersesFromSource("KJV Bible", book, chapter, verseStart, verseEnd),
    fetchVersesFromSource("Yoruba Bible", book, chapter, verseStart, verseEnd),
  ]);

  const documents = [kjv, yoruba].filter(Boolean) as {
    content: string;
    reference: string;
    source: string;
  }[];

  if (documents.length === 0) return null;

  return { documents };
}


type LlmProvider = "cerebras" | "groq" | "gemini";

async function tryProviders(
  messages: any[]
): Promise<{ text: string; provider: LlmProvider }> {
   // Cerebras needs a payment method added before its account is usable
  // (see project notes) — skip it entirely for now so every request
  // doesn't waste time on 6 failed key attempts. Flip to true once
  // Cerebras is reactivated; no other code changes needed.
  const ENABLE_CEREBRAS = false;

  const providers: { name: LlmProvider; fn: (m: any[]) => Promise<string | null> }[] = [
    ...(ENABLE_CEREBRAS ? [{ name: "cerebras" as LlmProvider, fn: askCerebras }] : []),
    { name: "groq", fn: askGroq },
    { name: "gemini", fn: askGemini },
  ];
  for (const p of providers) {
    try {
      const result = await p.fn(messages);
      if (result) return { text: result, provider: p.name };
    } catch (err) {
      console.warn(`[LLM] ${p.name} threw an error`, err);
    }
  }

  throw new Error("All LLM providers (Cerebras, Groq, Gemini) failed to respond");
}


export async function nehemiahPipeline(
  input: NehemiahPipelineInput
) {

  const startTime = Date.now();

  const { question } = input;


  let embeddingMs: number | undefined;
  let searchMs: number | undefined;
  let matchesCount: number | undefined;
  let usedFallbackSearch: boolean | undefined;
  let usedExactHymnLookup: boolean = false;
  let usedExactVerseLookup: boolean = false;
  let llmProvider: LlmProvider | undefined;
  let llmMs: number | undefined;


  try {

    let documents: any[];

    const exactHymn = await tryExactHymnLookup(question);
    const exactVerse = exactHymn ? null : await tryExactVerseLookup(question);

    if (exactHymn) {

      console.log("[Exact Lookup] Hymn number detected", { hymnNumber: exactHymn.hymnNumber });

      documents = exactHymn.documents;
      usedExactHymnLookup = true;
      usedFallbackSearch = false;
      matchesCount = documents.length;
      searchMs = 0;
      embeddingMs = 0;

    } else if (exactVerse) {

      console.log("[Exact Lookup] Bible reference detected", {
        references: exactVerse.documents.map((d) => `${d.source}: ${d.reference}`),
      });

      documents = exactVerse.documents;
      usedExactVerseLookup = true;
      usedFallbackSearch = false;
      matchesCount = documents.length;
      searchMs = 0;
      embeddingMs = 0;

    } else {

      const embeddingStart = Date.now();

      const embedding = await createEmbedding(question);

      embeddingMs = Date.now() - embeddingStart;


      const searchStart = Date.now();

      documents = await searchDocuments(embedding);

      usedFallbackSearch = false;

      if (documents.length === 0) {
        usedFallbackSearch = true;
        documents = await searchDocuments(embedding, {
          matchThreshold: -1,
          matchCount: 3,
        });
      }

      searchMs = Date.now() - searchStart;
      matchesCount = documents.length;

    }


    const excerpts = documents.map((doc: any) => {
      let source: string | undefined = doc.source;
      if (!source && doc.metadata?.book) {
        source = doc.metadata?.language === "yoruba" ? "Yoruba Bible" : "KJV Bible";
      }
      return { content: doc.content, reference: doc.reference || null, source };
    });

    const systemPrompt = createSystemPrompt(excerpts, usedFallbackSearch ?? false);

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ];


    const llmStart = Date.now();

    const { text, provider } = await tryProviders(messages);

    llmProvider = provider;
    llmMs = Date.now() - llmStart;

    await logPipelineRun({
      question,
      embeddingMs,
      searchMs,
      matchesCount,
      usedFallbackSearch,
      llmProvider,
      llmMs,
      totalMs: Date.now() - startTime,
      status: "success",
    });

    return text;

  } catch (error: any) {

    await logPipelineRun({
      question,
      embeddingMs,
      searchMs,
      matchesCount,
      usedFallbackSearch,
      llmProvider,
      llmMs,
      totalMs: Date.now() - startTime,
      status: "error",
      errorMessage: error?.message?.slice(0, 500) ?? "Unknown error",
    });

    throw error;

  }

}