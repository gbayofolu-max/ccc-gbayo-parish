// add-language-fields.mjs — store each hymn's Yoruba and English text as separate metadata fields, so the projector
// control panel can show Yoruba only, English only, or both. METADATA ONLY: the hymn text and embeddings are never changed.
//   node --env-file=.env.local scripts/hymns/add-language-fields.mjs                          -> CHECK ONLY (writes nothing)
//   node --env-file=.env.local scripts/hymns/add-language-fields.mjs --apply --confirm=YES-WRITE
// A row is filled only when its stored text can be matched exactly to a known Yoruba block + English block
// (the PDF master, the church-supplied overrides, or a text with exactly one blank line between two blocks).
import { readFileSync } from 'node:fs';
const APPLY = process.argv.includes('--apply'), CONFIRM = process.argv.includes('--confirm=YES-WRITE');
const norm = (s) => String(s || '').replace(/\r/g, '').trim();
const num = (r) => { const m = /(\d{1,4})/.exec(r || ''); return m ? parseInt(m[1], 10) : null; };
const master = new Map(JSON.parse(readFileSync('scripts/hymns/hymn-master-from-pdf.json', 'utf8')).hymns.filter((h) => h.status === 'present').map((h) => [h.number, h]));
const over = new Map(JSON.parse(readFileSync('scripts/hymns/hymn-manual-overrides.json', 'utf8')).map((o) => [o.number, o]));
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Missing Supabase URL or service key in .env.local'); process.exit(1); }
const { createClient } = await import('@supabase/supabase-js');
const sb = createClient(url, key, { auth: { persistSession: false } });

const rows = [];
for (let from = 0; ; from += 500) {
  const { data, error } = await sb.from('documents').select('id,reference,content,metadata').eq('category', 'hymn').order('id').range(from, from + 499);
  if (error) { console.error('Query failed:', error.message); process.exit(1); }
  rows.push(...data); if (data.length < 500) break;
}
const plan = [], skipped = [], how = {};
for (const r of rows) {
  const n = num(r.reference); let yo = null, en = null, src = null;
  const o = over.get(n), m = master.get(n);
  if (o && norm(r.content) === norm(`${o.yoruba.trim()}\n\n${o.english.trim()}`)) { yo = o.yoruba.trim(); en = o.english.trim(); src = 'church-supplied'; }
  else if (m && m.yoruba && m.english && norm(r.content) === norm(`${m.yoruba}\n\n${m.english}`)) { yo = norm(m.yoruba); en = norm(m.english); src = 'pdf-master'; }
  else {
    const parts = norm(r.content).split(/\n\s*\n/);
    if (parts.length === 2) { yo = parts[0].trim(); en = parts[1].trim(); src = 'two-blocks'; }
    else if (n) { // hand-added rows repeat the hymn number where each language starts ("153.1. MO nlo..." ... "153.1. I AM going...")
      const starts = parts.map((p, i) => (new RegExp(`^\\s*${n}\\b`).test(p) ? i : -1)).filter((i) => i >= 0);
      if (starts.length === 2 && starts[0] === 0) { yo = parts.slice(0, starts[1]).join('\n\n').trim(); en = parts.slice(starts[1]).join('\n\n').trim(); src = 'number-marker'; }
    }
  }
  if (!yo || !en) { skipped.push(r.reference); continue; }
  if (r.metadata?.yoruba === yo && r.metadata?.english === en) continue;
  how[src] = (how[src] || 0) + 1; plan.push({ id: r.id, reference: r.reference, metadata: { ...(r.metadata || {}), yoruba: yo, english: en, language_fields: 'v1' } });
}
console.log(`Hymn rows read: ${rows.length} | to fill: ${plan.length} ${JSON.stringify(how)} | cannot split safely (left as is): ${skipped.length}${skipped.length ? ' -> ' + skipped.join(', ') : ''}`);
if (!APPLY) { console.log('CHECK ONLY: nothing was written.'); process.exit(0); }
if (!CONFIRM) { console.error('Refusing to write: add --confirm=YES-WRITE'); process.exit(1); }
let ok = 0, bad = 0;
for (const p of plan) {
  const { error } = await sb.from('documents').update({ metadata: p.metadata }).eq('id', p.id).eq('category', 'hymn');
  if (error) { bad++; console.error(`FAILED ${p.reference}: ${error.message}`); if (bad >= 3) { console.error('Stopping after 3 failures.'); break; } } else ok++;
}
console.log(`DONE: ${ok} ok, ${bad} failed. (Text and embeddings untouched.)`);
