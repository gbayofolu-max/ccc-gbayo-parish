import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse-fork');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JINA_KEYS: string[] = [];
if (process.env.JINA_API_KEY) JINA_KEYS.push(process.env.JINA_API_KEY);
for (let i = 2; i <= 10; i++) {
  const k = process.env[`JINA_KEY_${i}`];
  if (k) JINA_KEYS.push(k);
}
if (JINA_KEYS.length === 0) throw new Error('No Jina API key found in .env.local');
console.log(`🔑 Loaded ${JINA_KEYS.length} Jina API key(s)`);

let currentKeyIndex = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const CATEGORY_MAP: Record<string, string> = {
  hymns: 'Hymn',
  legacy: 'Legacy',
  lessons: 'Lesson',
  sermons: 'Sermon',
  announcements: 'Announcement',
  pdfs: 'General',
};

const DB_CATEGORY_MAP: Record<string, string> = {
  hymns: 'hymn',
  legacy: 'legacy',
  lessons: 'lesson',
  sermons: 'sermon',
  announcements: 'announcement',
  pdfs: 'general',
};

const MINISTRY_VALUES: Record<string, string> = {
  hymns: 'reverence',
  legacy: 'tradition',
  lessons: 'teaching',
  sermons: 'kingdom',
  announcements: 'practical',
  pdfs: 'general',
};

function pad1536(vec: number[]): number[] {
  const padded = new Array(1536).fill(0);
  for (let i = 0; i < vec.length && i < 1536; i++) padded[i] = vec[i];
  return padded;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const maxFullCycles = 3;

  for (let cycle = 0; cycle < maxFullCycles; cycle++) {
    for (let attempt = 0; attempt < JINA_KEYS.length; attempt++) {
      const key = JINA_KEYS[currentKeyIndex];
      const keyLabel = `key #${currentKeyIndex + 1}`;

      const res = await fetch('https://api.jina.ai/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'jina-embeddings-v3',
          input: texts,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        return json.data.map((d: any) => pad1536(d.embedding as number[]));
      }

      const errText = await res.text();
      console.log(`   ⚠️ Jina ${keyLabel} failed (status ${res.status}): ${errText.slice(0, 150)}`);
      console.log(`   ↪ Rotating to next key...`);

      currentKeyIndex = (currentKeyIndex + 1) % JINA_KEYS.length;
    }

    console.log(`   ⏳ All ${JINA_KEYS.length} Jina key(s) failed this pass — waiting 20s before retrying...`);
    await sleep(20000);
  }

  throw new Error('All Jina keys failed after multiple retry cycles — check balances/rate limits on each');
}

function getPdfFiles(dir: string, all: string[] = []): string[] {
  if (!fs.existsSync(dir)) return all;
  for (const file of fs.readdirSync(dir)) {
    const f = path.join(dir, file);
    if (fs.statSync(f).isDirectory()) getPdfFiles(f, all);
    else if (f.endsWith('.pdf')) all.push(f);
  }
  return all;
}

function parseHymnChunks(text: string): { hymnNumber: number; content: string }[] {
  const markerRegex = /^Hymn\s+(\d+)\s*$/gm;
  const matches: { index: number; number: number }[] = [];
  let m: RegExpExecArray | null;

  while ((m = markerRegex.exec(text)) !== null) {
    matches.push({ index: m.index, number: parseInt(m[1], 10) });
  }

  if (matches.length === 0) return [];

  const grouped = new Map<number, string>();
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const chunkText = text.slice(start, end).trim();
    const num = matches[i].number;
    grouped.set(num, grouped.has(num) ? `${grouped.get(num)}\n\n${chunkText}` : chunkText);
  }

  return Array.from(grouped.entries())
    .map(([hymnNumber, content]) => ({ hymnNumber, content }))
    .sort((a, b) => a.hymnNumber - b.hymnNumber);
}

let globalId = 1000000;

async function embedAndInsertBatches(
  contentChunks: string[],
  referencesForChunk: (string | null)[],
  dbCategory: string,
  displayCategory: string,
  fileName: string,
  filePath: string,
  ministryValue: string
) {
  const batchSize = 20;
  let insertedTotal = 0;

  for (let i = 0; i < contentChunks.length; i += batchSize) {
    const batchTexts = contentChunks.slice(i, i + batchSize);
    const batchRefs = referencesForChunk.slice(i, i + batchSize);

    const batchEmbeds = await embedBatch(batchTexts);

    const rows = batchTexts.map((content, j) => ({
      id: globalId++,
      content,
      embedding: batchEmbeds[j],
      category: dbCategory,
      source: fileName,
      reference: batchRefs[j],
      metadata: {
        source: filePath,
        fileName,
        category: displayCategory,
        chunk_index: i + j,
        ministry_value: ministryValue,
      },
    }));

    const { error: insErr } = await supabase.from('documents').insert(rows);
    if (insErr) {
      console.error(`\n   ❌ Insert failed for this batch: ${insErr.message}`);
    } else {
      insertedTotal += rows.length;
    }

    process.stdout.write(`   Embedded + saved ${Math.min(i + batchSize, contentChunks.length)}/${contentChunks.length}\r`);

    if (i + batchSize < contentChunks.length) {
      await sleep(2000);
    }
  }

  console.log();
  return insertedTotal;
}

async function main() {
  console.log('\n🚀 Nehemiah PDF Ingestion (Jina v3 → 1536d)\n');

  const pdfPaths = getPdfFiles('public');
  if (pdfPaths.length === 0) {
    console.log('⚠️ No PDFs found in public/');
    return;
  }
  console.log(`🔎 Found ${pdfPaths.length} PDF(s)\n`);

  const { data: maxRow, error: maxErr } = await supabase
    .from('documents')
    .select('id')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxErr) console.warn(`⚠️ Could not read current max id: ${maxErr.message}`);
  globalId = maxRow?.id ? maxRow.id + 1 : 1000000;

  for (const filePath of pdfPaths) {
    const fileName = path.basename(filePath);
    const folder = path.basename(path.dirname(filePath));
    const displayCategory = CATEGORY_MAP[folder] || 'General';
    const dbCategory = DB_CATEGORY_MAP[folder] || 'general';
    const ministryValue = MINISTRY_VALUES[folder] || 'general';

    console.log(`📄 ${fileName} → [${folder}] → ${displayCategory}`);

    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    const text: string = data.text?.trim() || '';

    if (!text) {
      console.warn(`  ⚠️ Empty PDF — skipped\n`);
      continue;
    }

    if (folder === 'hymns') {
      const hymnChunks = parseHymnChunks(text);
      console.log(`   Detected hymn book — parsed ${hymnChunks.length} individual hymns`);

      if (hymnChunks.length === 0) {
        console.warn(`  ⚠️ No "Hymn N" markers found — skipping file\n`);
        continue;
      }

      // Resumability: skip hymns already saved from a previous run
      const { data: existingRows } = await supabase
        .from('documents')
        .select('reference')
        .eq('category', 'hymn')
        .eq('source', fileName);

      const existingRefs = new Set((existingRows || []).map((r) => r.reference));
      const remaining = hymnChunks.filter((h) => !existingRefs.has(`Hymn ${h.hymnNumber}`));

      console.log(`   Already saved: ${existingRefs.size} — remaining to ingest: ${remaining.length}`);

      if (remaining.length === 0) {
        console.log(`   ✅ All hymns already ingested — skipping\n`);
        continue;
      }

      const contentChunks = remaining.map((h) => h.content);
      const referencesForChunk = remaining.map((h) => `Hymn ${h.hymnNumber}`);

      const inserted = await embedAndInsertBatches(
        contentChunks,
        referencesForChunk,
        dbCategory,
        displayCategory,
        fileName,
        filePath,
        ministryValue
      );

      console.log(`   ✅ Inserted ${inserted} new hymn(s)\n`);
      continue;
    }

    // Non-hymn files: original delete-then-reinsert behavior
    const { error: delErr } = await supabase
      .from('documents')
      .delete()
      .eq('metadata->>source', filePath);

    if (delErr) console.warn(`  ⚠️ Delete warning: ${delErr.message}`);

    const contentChunks: string[] = [];
    const referencesForChunk: (string | null)[] = [];
    const stride = 800;
    for (let i = 0; i < text.length; i += stride) {
      contentChunks.push(text.slice(i, i + 1000));
      referencesForChunk.push(null);
    }

    console.log(`   Split into ${contentChunks.length} chunk(s)`);

    const inserted = await embedAndInsertBatches(
      contentChunks,
      referencesForChunk,
      dbCategory,
      displayCategory,
      fileName,
      filePath,
      ministryValue
    );

    console.log(`   ✅ Inserted ${inserted} chunk(s)\n`);
  }

  console.log('🏁 Ingestion complete.\n');
}

main().catch((err) => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});