import { NextRequest, NextResponse } from "next/server";
import { createEmbedding } from "@/ai/embeddings/jina";
import { searchDocuments } from "@/ai/search/search";
import { buildHymnIndex, matchHymn, rankVerses, type HymnIndex, type HymnRow } from "@/lib/voice/quoteMatch";

// Finds the hymn or Bible verse that a spoken or sung sentence is quoting, even when no number or reference is said.
//  - Hymns: matched word-for-word against the hymn book (Yoruba or English), no AI cost.
//  - Bible verses: the verse search proposes candidates, then the words actually spoken decide which one it really is.
// Only signed-in staff may use it, and it is rate limited.

const calls: number[] = [];
let hymnCache: { index: HymnIndex; at: number } | null = null;

async function isSignedIn(request: NextRequest): Promise<boolean> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !key) return false;
  try {
    const res = await fetch(`${url}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: key }, cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

async function loadHymns(): Promise<HymnIndex | null> {
  if (hymnCache && Date.now() - hymnCache.at < 10 * 60 * 1000) return hymnCache.index;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const res = await fetch(
    `${url}/rest/v1/documents?select=reference,yoruba:metadata->>yoruba,english:metadata->>english&category=eq.hymn&tenant_id=eq.gbayo&limit=2000`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" }
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as HymnRow[];
  if (!Array.isArray(rows) || rows.length === 0) return null;

  hymnCache = { index: buildHymnIndex(rows), at: Date.now() };
  return hymnCache.index;
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isSignedIn(request))) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

    const now = Date.now();
    while (calls.length && now - calls[0] > 60000) calls.shift();
    if (calls.length >= 15) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    calls.push(now);

    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text.trim().slice(0, 300) : "";
    if (text.split(/\s+/).length < 4) return NextResponse.json({ kind: "none", matches: [] });

    // 1) Hymns first: free and exact.
    const hymns = await loadHymns();
    const hymn = hymns ? matchHymn(hymns, text) : null;
    if (hymn) {
      const matches = [{ type: "hymn", number: hymn.number, language: hymn.language, label: `Hymn ${hymn.number}` }];
      for (const other of hymn.others) matches.push({ type: "hymn", number: other, language: hymn.language, label: `Hymn ${other}` });
      return NextResponse.json({ kind: "hymn", confidence: hymn.clear && hymn.coverage >= 0.6 ? "high" : "maybe", matches });
    }

    // 2) Bible verses: the search proposes, the spoken words decide.
    const embedding = await createEmbedding(text);
    const rows = await searchDocuments(embedding, { matchThreshold: 0.5, matchCount: 8, filterCategory: "scripture" });
    const { best, high, maybe } = rankVerses(text, rows);
    if (!best || maybe.length === 0) return NextResponse.json({ kind: "none", matches: [] });

    const list = high ? [best] : maybe;
    return NextResponse.json({
      kind: "verse",
      confidence: high ? "high" : "maybe",
      matches: list.map((m) => ({ type: "verse", book: m.book, chapter: m.chapter, verse: m.verse, language: m.language, label: m.label, overlap: Math.round(m.overlap * 100) / 100, similarity: Math.round(m.similarity * 100) / 100 })),
    });
  } catch (error) {
    console.error("VOICE QUOTE ERROR:", error);
    return NextResponse.json({ kind: "none", matches: [] });
  }
}
