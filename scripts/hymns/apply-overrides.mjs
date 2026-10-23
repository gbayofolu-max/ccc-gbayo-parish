// apply-overrides.mjs — put church-supplied hymn lyrics (scripts/hymns/hymn-manual-overrides.json) into `documents`.
//   node scripts/hymns/apply-overrides.mjs                                            -> PREVIEW. Local only, no database access.
//   node --env-file=.env.local scripts/hymns/apply-overrides.mjs --apply --confirm=YES-WRITE
//        -> for each listed hymn: looks the row up LIVE by reference (not from an old export). Exactly one row = update it.
//           No row = insert one. More than one row = stop. Never deletes. Never touches the embedding; the row is tagged
//           metadata.embedding_stale=true so embed-stale-hymns.mjs can embed it.
import { readFileSync } from 'node:fs';
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const CONFIRM = args.some((a) => a === '--confirm=YES-WRITE');
const ITEMS = JSON.parse(readFileSync('scripts/hymns/hymn-manual-overrides.json', 'utf8'));
const content = (it) => `${it.yoruba.trim()}\n\n${it.english.trim()}`;

for (const it of ITEMS) {
  console.log(`\n=== Hymn ${it.number} ===\n${content(it)}\n`);
}
if (!APPLY) { console.log('PREVIEW ONLY: nothing was sent to Supabase.'); process.exit(0); }
if (!CONFIRM) { console.error('Refusing to write: add --confirm=YES-WRITE'); process.exit(1); }

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Missing Supabase URL or service key in .env.local'); process.exit(1); }
const { createClient } = await import('@supabase/supabase-js');
const sb = createClient(url, key, { auth: { persistSession: false } });
let failed = 0;
for (const it of ITEMS) {
  const ref = `Hymn ${it.number}`, text = content(it);
  const found = await sb.from('documents').select('id,reference,metadata').eq('category', 'hymn').eq('reference', ref);
  if (found.error) { console.error(`${ref}: lookup failed: ${found.error.message}`); failed++; continue; }
  if (found.data.length > 1) { console.error(`${ref}: ${found.data.length} rows exist (ids ${found.data.map((r) => r.id).join(', ')}). Stopping this hymn; no change made.`); failed++; continue; }
  let res;
  if (found.data.length === 1) {
    const old = found.data[0];
    const metadata = { ...old.metadata, ministry_value: old.metadata?.ministry_value || 'reverence', master: 'church-supplied', override_note: it.note, embedding_stale: true };
    res = await sb.from('documents').update({ content: text, metadata }).eq('id', old.id).eq('category', 'hymn').select('id,content').single();
  } else {
    const metadata = { source: 'church-supplied lyrics', category: 'Hymn', ministry_value: 'reverence', master: 'church-supplied', override_note: it.note, embedding_stale: true };
    res = await sb.from('documents').insert([{ reference: ref, source: 'CCC-Hymns latest(1).pdf', category: 'hymn', tenant_id: 'gbayo', content: text, metadata }]).select('id,content').single();
  }
  if (res.error || (res.data?.content || '').trim() !== text) { failed++; console.error(`${ref}: FAILED ${res.error?.message || 'read-back mismatch'}`); }
  else console.log(`${ref}: ${found.data.length === 1 ? 'updated' : 'inserted'} (row ${res.data.id}).`);
}
console.log(failed ? `Finished with ${failed} problem(s).` : 'Done. Next: run embed-stale-hymns.mjs to embed the updated row(s).');
