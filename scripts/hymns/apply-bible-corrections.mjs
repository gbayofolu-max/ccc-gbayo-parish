// apply-bible-corrections.mjs — remove the footnote / section-title leftovers from the 44 approved Yoruba Bible verses.
//   node --env-file=.env.local scripts/hymns/apply-bible-corrections.mjs
//        -> CHECK ONLY (default). Looks each verse up live and reports whether it is safe to correct. Writes nothing.
//   node --env-file=.env.local scripts/hymns/apply-bible-corrections.mjs --apply --confirm=YES-WRITE --only="Acts 8:36"
//        -> corrects just that verse (use "A|B|C" for several). Drop --only to correct all that pass the check.
// Safety: a verse is changed ONLY if exactly one live Yoruba row exists AND its text still equals the text the proposal was built
// from. Anything else is skipped and reported. Never deletes. Saves a backup of every old text first. Then re-embeds only the
// corrected rows, and only after proving the embedding recipe matches your stored Bible embeddings. Prints no keys.
import { readFileSync, writeFileSync } from 'node:fs';
const CSV = 'scripts/ocr-work/yoruba-scripture-audit/correction-proposal-popup-removal-v2.csv';
const args = process.argv.slice(2);
const flag = (n) => args.find((a) => a === `--${n}` || a.startsWith(`--${n}=`));
const val = (n) => { const f = flag(n); return f && f.includes('=') ? f.split('=').slice(1).join('=') : null; };
const APPLY = !!flag('apply');
const ONLY = val('only') ? new Set(val('only').split('|').map((s) => s.trim())) : null;

function parseCsv(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f.replace(/\r$/, '')); rows.push(row); }
  const head = rows.shift().map((h) => h.replace(/^\ufeff/, ''));
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}
const norm = (s) => String(s || '').normalize('NFC').replace(/\s+/g, ' ').trim();
let items = parseCsv(readFileSync(CSV, 'utf8'));
if (ONLY) items = items.filter((i) => ONLY.has(i.reference));
console.log(`Proposals selected: ${items.length}`);

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Missing Supabase URL or service key in .env.local'); process.exit(1); }
const { createClient } = await import('@supabase/supabase-js');
const sb = createClient(url, key, { auth: { persistSession: false } });

const ok = [], skipped = [];
for (const it of items) {
  const { data, error } = await sb.from('documents').select('id,reference,content,metadata').eq('category', 'scripture').eq('source', 'Yoruba Bible').eq('reference', it.reference);
  if (error) { skipped.push([it.reference, 'lookup error: ' + error.message]); continue; }
  if (data.length === 0) { skipped.push([it.reference, 'no live Yoruba row']); continue; }
  if (data.length > 1) { skipped.push([it.reference, `${data.length} live rows (ids ${data.map((d) => d.id).join(', ')})`]); continue; }
  if (norm(data[0].content) !== norm(it.currentDatabaseText)) { skipped.push([it.reference, 'live text differs from the proposal baseline']); continue; }
  const proposed = String(it.proposedReplacement).trim();
  if (!proposed || proposed.length < 10) { skipped.push([it.reference, 'proposed text looks empty']); continue; }
  ok.push({ row: data[0], proposed, reference: it.reference });
}
console.log(`SAFE to correct: ${ok.length} | SKIPPED: ${skipped.length}`);
for (const [r, why] of skipped) console.log(`  skipped ${r}: ${why}`);
if (!APPLY) { console.log('CHECK ONLY: nothing was written.'); process.exit(0); }
if (val('confirm') !== 'YES-WRITE') { console.error('Refusing to write: add --confirm=YES-WRITE'); process.exit(1); }
if (ok.length === 0) { console.log('Nothing to do.'); process.exit(0); }

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = `scripts/ocr-work/yoruba-scripture-audit/pre-correction-backup-${stamp}.json`;
writeFileSync(backup, JSON.stringify(ok.map((o) => ({ id: o.row.id, reference: o.reference, content: o.row.content, metadata: o.row.metadata })), null, 1));
console.log(`Backup of old texts saved: ${backup}`);

let done = 0, bad = 0; const updated = [];
for (const o of ok) {
  const metadata = { ...(o.row.metadata || {}), correction: 'popup-note-removal-2026-10', embedding_stale: true };
  const res = await sb.from('documents').update({ content: o.proposed, metadata }).eq('id', o.row.id).eq('category', 'scripture').eq('source', 'Yoruba Bible').select('id,content').single();
  if (res.error || norm(res.data?.content) !== norm(o.proposed)) { bad++; console.error(`FAILED ${o.reference}: ${res.error?.message || 'read-back mismatch'}`); if (bad >= 3) { console.error('Stopping after 3 failures.'); break; } }
  else { done++; updated.push({ ...o, metadata }); }
}
console.log(`CORRECTED: ${done} ok, ${bad} failed.`);

// ---- embeddings for the corrected rows only ----
const JINA = process.env.JINA_API_KEY;
if (!JINA) { console.log('JINA_API_KEY missing: rows stay tagged embedding_stale; embeddings not refreshed.'); process.exit(0); }
async function embed(texts, attempt = 1) {
  try {
    const res = await fetch('https://api.jina.ai/v1/embeddings', { method: 'POST', headers: { Authorization: `Bearer ${JINA}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'jina-embeddings-v3', input: texts }) });
    if (!res.ok) throw new Error(`Jina ${res.status}`);
    const j = await res.json(); const items2 = [...j.data].sort((a, b) => a.index - b.index);
    return items2.map((d) => { const p = new Array(1536).fill(0); for (let i = 0; i < d.embedding.length && i < 1536; i++) p[i] = d.embedding[i]; return p; });
  } catch (e) { if (attempt < 3) { await new Promise((r) => setTimeout(r, 1500 * attempt)); return embed(texts, attempt + 1); } throw e; }
}
const cos = (a, b) => { let d = 0, x = 0, y = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; x += a[i] * a[i]; y += b[i] * b[i]; } return d / Math.sqrt(x * y); };
const changed = new Set(items.map((i) => i.reference));
const probe = await sb.from('documents').select('content,embedding').eq('category', 'scripture').eq('source', 'Yoruba Bible').eq('reference', changed.has('Genesis 1:1') ? 'Genesis 1:2' : 'Genesis 1:1').single();
if (probe.error || !probe.data?.embedding) { console.log('Could not prove the embedding recipe (no probe row): rows stay tagged embedding_stale. Tell Claude.'); process.exit(0); }
const [fresh] = await embed([probe.data.content]);
const stored = Array.isArray(probe.data.embedding) ? probe.data.embedding : JSON.parse(probe.data.embedding);
const c = cos(fresh, stored);
console.log(`Embedding recipe check on an untouched verse: cosine ${c.toFixed(4)}`);
if (c < 0.985) { console.log('Recipe differs from your stored Bible embeddings: NOT re-embedding. Rows stay tagged embedding_stale. Tell Claude.'); process.exit(0); }
let emb = 0;
for (let i = 0; i < updated.length; i += 16) {
  const chunk = updated.slice(i, i + 16); const vecs = await embed(chunk.map((o) => o.proposed));
  for (let j = 0; j < chunk.length; j++) {
    const meta = { ...chunk[j].metadata, embedding_stale: false };
    const r = await sb.from('documents').update({ embedding: '[' + vecs[j].join(',') + ']', metadata: meta }).eq('id', chunk[j].row.id).eq('category', 'scripture').eq('source', 'Yoruba Bible');
    if (r.error) console.error(`embedding FAILED ${chunk[j].reference}: ${r.error.message}`); else emb++;
  }
}
console.log(`RE-EMBEDDED: ${emb}/${updated.length}. Done.`);
