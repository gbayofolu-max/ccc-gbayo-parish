// scripts/ingest-yoruba-ebible.ts
// Yoruba Bible ingestion from eBible.org (clean typed HTML, not OCR).
// Dry-run by default. Set INGEST=yes to actually write to Supabase.

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JINA_KEYS: string[] = [];
if (process.env.JINA_API_KEY) JINA_KEYS.push(process.env.JINA_API_KEY);
for (let i = 2; i <= 10; i++) {
  const k = process.env[`JINA_KEY_${i}`] || process.env[`JINA_API_KEY_${i}`];
  if (k) JINA_KEYS.push(k);
}

let currentKeyIndex = 0;
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function pad1536(vec: number[]): number[] {
  const padded = new Array(1536).fill(0);
  for (let i = 0; i < vec.length && i < 1536; i++) padded[i] = vec[i];
  return padded;
}

// ── Reused verbatim from ingest-kjv.ts ──────────────────────────────

async function embedBatch(texts: string[]): Promise<number[][]> {
  if (JINA_KEYS.length === 0) throw new Error('No Jina API key found in .env.local');
  const maxFullCycles = 5;
  for (let cycle = 0; cycle < maxFullCycles; cycle++) {
    for (let attempt = 0; attempt < JINA_KEYS.length; attempt++) {
      const key = JINA_KEYS[currentKeyIndex];
      try {
        const res = await fetch('https://api.jina.ai/v1/embeddings', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'jina-embeddings-v3', input: texts }),
        });
        if (res.ok) {
          const json = await res.json();
          return json.data.map((d: any) => pad1536(d.embedding as number[]));
        }
        const errText = await res.text();
        console.log(`   ⚠️ Jina key #${currentKeyIndex + 1} failed (${res.status}): ${errText.slice(0, 150)}`);
      } catch (e: any) {
        console.log(`   ⚠️ Jina key #${currentKeyIndex + 1} network error: ${e.message}`);
      }
      currentKeyIndex = (currentKeyIndex + 1) % JINA_KEYS.length;
    }
    console.log(`   ⏳ All Jina keys failed this pass — waiting 20s before retrying...`);
    await sleep(20000);
  }
  throw new Error('All Jina keys failed after multiple retry cycles');
}

async function insertWithRetry(rows: any[], maxAttempts = 4): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { error } = await supabase.from('documents').insert(rows);
    if (!error) return true;
    console.log(`   ⚠️ Insert attempt ${attempt} failed: ${error.message}`);
    if (attempt < maxAttempts) await sleep(3000);
  }
  return false;
}

async function fetchAllExistingRefs(source: string): Promise<Set<string>> {
  const refs = new Set<string>();
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('documents')
      .select('reference')
      .eq('category', 'scripture')
      .eq('source', source)
      .range(from, from + pageSize - 1);

    if (error) {
      console.warn(`⚠️ Error fetching existing refs page at offset ${from}: ${error.message}`);
      break;
    }
    if (!data || data.length === 0) break;

    for (const r of data) refs.add(r.reference);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return refs;
}

// ── Book list: English names (for `reference`), eBible codes, chapter counts ──

const BOOK_ORDER = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth',
  '1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra',
  'Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon',
  'Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos',
  'Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi',
  'Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians',
  'Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians',
  '1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter',
  '1 John','2 John','3 John','Jude','Revelation',
];

const BOOK_CODES = [
  'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR',
  'NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO',
  'OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL','MAT','MRK','LUK','JHN','ACT','ROM',
  '1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE',
  '2PE','1JN','2JN','3JN','JUD','REV',
];

const CHAPTER_COUNTS = [
  50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,
  3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22,
];

if (BOOK_ORDER.length !== 66 || BOOK_CODES.length !== 66 || CHAPTER_COUNTS.length !== 66) {
  throw new Error('Book list arrays are out of sync — this must never happen.');
}

const CACHE_DIR = 'data/ebible-yor';
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

// ── Fetching (with disk cache + polite delay) ────────────────────────
// Padding width is derived from the book's own chapter count, not hardcoded:
// confirmed via curl that Psalms (150 chapters) needs 3-digit padding
// (PSA001.htm) while every other book uses 2-digit (GEN01.htm).

function padWidthFor(numChapters: number): number {
  return Math.max(2, String(numChapters).length);
}

async function fetchChapterHtml(bookCode: string, chapter: number, numChapters: number): Promise<string> {
  const width = padWidthFor(numChapters);
  const padded = String(chapter).padStart(width, '0');
  const fileName = `${bookCode}${padded}.htm`;
  const cachePath = path.join(CACHE_DIR, fileName);

  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath, 'utf-8');
  }

  const url = `https://ebible.org/yor/${fileName}`;
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      fs.writeFileSync(cachePath, html, 'utf-8');
      await sleep(700); // polite crawl delay — only on a real network fetch
      return html;
    } catch (e: any) {
      console.log(`   ⚠️ Fetch attempt ${attempt} failed for ${fileName}: ${e.message}`);
      if (attempt < maxAttempts) await sleep(2000);
    }
  }
  throw new Error(`Failed to fetch ${url} after ${maxAttempts} attempts`);
}

// ── HTML parsing ──────────────────────────────────────────────────────

function decodeEntities(s: string): string {
  return s
    .replace(/&#160;/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, ' ');
}

function extractMainDiv(html: string): string {
  const startMatch = html.match(/<div[^>]*\bclass=["'][^"']*\bmain\b[^"']*["'][^>]*>/i);
  if (!startMatch || startMatch.index === undefined) return html;

  let pos = startMatch.index + startMatch[0].length;
  let depth = 1;
  const divTagRegex = /<div\b[^>]*>|<\/div>/gi;
  divTagRegex.lastIndex = pos;
  let m: RegExpExecArray | null;
  let contentEnd = html.length;

  while ((m = divTagRegex.exec(html)) !== null) {
    if (m[0].toLowerCase() === '</div>') {
      depth--;
      if (depth === 0) { contentEnd = m.index; break; }
    } else {
      depth++;
    }
  }

  return html.slice(pos, contentEnd);
}

interface ParsedVerse { verse: number; text: string; }

function parseVersesFromHtml(html: string): ParsedVerse[] {
  let cleaned = html.replace(/<div[^>]*\bclass=["'][^"']*footnote[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<span[^>]*\bclass=["']fn["'][^>]*>[\s\S]*?<\/span>/gi, '');

  const main = extractMainDiv(cleaned);

  const spanRegex = /<span\s+class=["']verse["']\s+id=["']V(\d+)["']\s*>[\s\S]*?<\/span>/gi;
  const markers: { verse: number; endIndex: number; startIndex: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = spanRegex.exec(main)) !== null) {
    markers.push({ verse: parseInt(m[1], 10), startIndex: m.index, endIndex: m.index + m[0].length });
  }

  const verses: ParsedVerse[] = [];
  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i];
    const textEnd = i + 1 < markers.length ? markers[i + 1].startIndex : main.length;
    const rawChunk = main.slice(marker.endIndex, textEnd);
    const text = decodeEntities(stripTags(rawChunk)).replace(/\s+/g, ' ').trim();
    if (text) verses.push({ verse: marker.verse, text });
  }

  return verses;
}

// ── Main ──────────────────────────────────────────────────────────────

interface FlatVerse { book: string; chapter: number; verse: number; text: string; }

async function main() {
  const dryRun = process.env.INGEST !== 'yes';
  console.log(`\n📖 Yoruba Bible Ingestion (eBible.org)${dryRun ? '  — DRY RUN (set INGEST=yes to write)' : '  — LIVE WRITE MODE'}\n`);

  const allVerses: FlatVerse[] = [];
  let genesis1Verses: ParsedVerse[] = [];

  for (let b = 0; b < BOOK_CODES.length; b++) {
    const code = BOOK_CODES[b];
    const bookName = BOOK_ORDER[b];
    const numChapters = CHAPTER_COUNTS[b];
    let bookVerseCount = 0;

    for (let ch = 1; ch <= numChapters; ch++) {
      const html = await fetchChapterHtml(code, ch, numChapters);
      const verses = parseVersesFromHtml(html);

      if (code === 'GEN' && ch === 1) genesis1Verses = verses;

      for (const v of verses) {
        allVerses.push({ book: bookName, chapter: ch, verse: v.verse, text: v.text });
      }
      bookVerseCount += verses.length;
    }

    console.log(`   ${bookName.padEnd(20)} ${bookVerseCount} verses`);
  }

  console.log(`\n   TOTAL parsed: ${allVerses.length} verses (expect ~31,000)\n`);

  console.log('── Sanity check: Genesis 1 ──');
  console.log(`   Verse count: ${genesis1Verses.length} (must be 31)`);
  const v3 = genesis1Verses.find(v => v.verse === 3);
  console.log(`   Verse 3: ${v3 ? v3.text : '❌ MISSING'}`);

  if (genesis1Verses.length !== 31) {
    console.warn('\n⚠️ Genesis 1 sanity check FAILED — stopping before any database write.\n');
    return;
  }

  if (dryRun) {
    console.log('\n✅ Dry run complete. Nothing written to Supabase.');
    console.log('   Review the counts above, then rerun with INGEST=yes to ingest for real.\n');
    return;
  }

  if (allVerses.length < 29000 || allVerses.length > 32000) {
    console.warn('⚠️ Total verse count looks off — stopping before ingesting.\n');
    return;
  }

  console.log('\n   Checking existing rows (paginated, no 1000-row cap)...');
  const existingRefs = await fetchAllExistingRefs('Yoruba Bible');
  const toInsert = allVerses.filter(v => !existingRefs.has(`${v.book} ${v.chapter}:${v.verse}`));
  console.log(`   Already saved: ${existingRefs.size} — remaining to ingest: ${toInsert.length}`);

  if (toInsert.length === 0) {
    console.log('   ✅ All verses already ingested — nothing to do.\n');
    return;
  }

  const { data: maxRow } = await supabase
    .from('documents').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
  let globalId = maxRow?.id ? maxRow.id + 1 : 1;

  const batchSize = 10;
  let totalInserted = 0;
  let totalFailedBatches = 0;

  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const embeddings = await embedBatch(batch.map(v => v.text));

    const rows = batch.map((v, j) => ({
      id: globalId++,
      content: v.text,
      embedding: embeddings[j],
      category: 'scripture',
      source: 'Yoruba Bible',
      reference: `${v.book} ${v.chapter}:${v.verse}`,
      metadata: { book: v.book, chapter: v.chapter, verse: v.verse, language: 'yoruba' },
    }));

    const success = await insertWithRetry(rows);
    if (success) totalInserted += rows.length;
    else totalFailedBatches++;

    process.stdout.write(`   Embedded + saved ${Math.min(i + batchSize, toInsert.length)}/${toInsert.length}\r`);
    if (i + batchSize < toInsert.length) await sleep(1000);
  }

  console.log(`\n✅ Inserted ${totalInserted} verses. Failed batches after retries: ${totalFailedBatches}\n`);
}

main().catch((err) => { console.error('\n💥 Fatal error:', err); process.exit(1); });
