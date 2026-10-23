// sync-hymns.mjs — plan (default) or apply the PDF-built hymn master to Supabase `documents`.
//
//   node scripts/hymns/sync-hymns.mjs                       -> DRY RUN. Reads two local files only. Writes a plan. No database access.
//   node --env-file=.env.local scripts/hymns/sync-hymns.mjs --apply --confirm=YES-WRITE --only=5
//                                                           -> writes ONLY hymn 5 (test). Then verifies it by reading it back.
//   node --env-file=.env.local scripts/hymns/sync-hymns.mjs --apply --confirm=YES-WRITE
//                                                           -> writes every planned hymn.
//
// Rules: updates by existing row id, inserts only for hymns the DB lacks, never deletes, never touches
// numbers the PDF lacks, never touches the embedding column (rows are tagged metadata.embedding_stale=true
// so the embedding step can find them). Secrets are never printed.
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = (n) => args.find((a) => a === `--${n}` || a.startsWith(`--${n}=`));
const val = (n) => { const f = flag(n); return f && f.includes('=') ? f.split('=').slice(1).join('=') : null; };
const APPLY = !!flag('apply');
const ONLY = val('only') ? new Set(val('only').split(',').map((x) => parseInt(x, 10))) : null;
const INCLUDE_SOLFA = !!flag('include-solfa');

const MASTER = JSON.parse(readFileSync('scripts/hymns/hymn-master-from-pdf.json', 'utf8')).hymns;
const DB = JSON.parse(readFileSync('scripts/hymns/db-hymns-export.json', 'utf8'));
const num = (ref) => { const m = /(\d{1,4})/.exec(ref || ''); return m ? parseInt(m[1], 10) : null; };
const dbBy = new Map(DB.map((r) => [num(r.reference), r]));
const norm = (t) => String(t || '').replace(/\r/g, '').trim();

function buildContent(h) {
  const parts = [];
  if (INCLUDE_SOLFA && h.solfa_yoruba?.length) parts.push(h.solfa_yoruba.join('\n'));
  parts.push(h.yoruba);
  const body = [parts.join('\n'), h.english].filter(Boolean).join('\n\n');
  return norm(body);
}
function buildMeta(h, old) {
  return {
    ...(old || {
      source: 'public\\hymns\\CCC-Hymns latest.pdf', category: 'Hymn', fileName: 'CCC-Hymns latest.pdf', ministry_value: 'reverence',
    }),
    ministry_value: (old && old.ministry_value) || 'reverence',   // 8 hand-added rows lacked this
    source_pages: h.pdf_pages,
    section_yoruba: h.section_yoruba, section_english: h.section_english,
    solfa_yoruba: h.solfa_yoruba, solfa_english: h.solfa_english,
    master: 'pdf-textlayer-2026-10', embedding_stale: true,
  };
}

const plan = [];
for (const h of MASTER) {
  if (!(h.status === 'present' && h.ready_for_sync)) continue;
  if (ONLY && !ONLY.has(h.number)) continue;
  const old = dbBy.get(h.number);
  const content = buildContent(h);
  if (!old) { plan.push({ number: h.number, action: 'INSERT', content, metadata: buildMeta(h, null) }); continue; }
  const same = norm(old.content) === content;
  const needsMeta = !old.metadata?.ministry_value || !old.metadata?.source_pages;
  plan.push({ number: h.number, action: same && !needsMeta ? 'NOCHANGE' : 'UPDATE', id: old.id, before: old.content, content, metadata: buildMeta(h, old.metadata) });
}
const kept = DB.filter((r) => !MASTER.some((h) => h.number === num(r.reference) && h.status === 'present' && h.ready_for_sync)).map((r) => num(r.reference));
const count = (a) => plan.filter((p) => p.action === a).length;

writeFileSync('scripts/hymns/sync-plan.json', JSON.stringify(plan, null, 1));
writeFileSync('scripts/hymns/sync-plan.csv', '\ufeffnumber,action,db_id,old_chars,new_chars\n' + plan.map((p) => [p.number, p.action, p.id ?? '', (p.before || '').length, p.content.length].join(',')).join('\n'));
const sample = plan.filter((p) => p.action === 'UPDATE').slice(0, 3).map((p) => `### Hymn ${p.number} (row ${p.id})\n**Before**\n\`\`\`\n${p.before.slice(0, 400)}\n\`\`\`\n**After**\n\`\`\`\n${p.content.slice(0, 400)}\n\`\`\``).join('\n\n');
writeFileSync('scripts/hymns/sync-preview.md', `# Sync preview\nUPDATE ${count('UPDATE')} · INSERT ${count('INSERT')} · NOCHANGE ${count('NOCHANGE')} · KEPT untouched ${kept.length}: ${kept.join(', ')}\n\n${sample}\n`);
console.log(`PLAN  UPDATE ${count('UPDATE')} | INSERT ${count('INSERT')} | NOCHANGE ${count('NOCHANGE')} | KEPT (untouched) ${kept.length}: ${kept.join(', ')}`);
console.log('Wrote scripts/hymns/sync-plan.json, sync-plan.csv, sync-preview.md');

if (!APPLY) { console.log('DRY RUN: nothing was sent to Supabase.'); process.exit(0); }
if (val('confirm') !== 'YES-WRITE') { console.error('Refusing to write: add --confirm=YES-WRITE'); process.exit(1); }

const { createClient } = await import('@supabase/supabase-js');
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Missing Supabase URL or service key in .env.local'); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });
let ok = 0, bad = 0;
for (const p of plan) {
  if (p.action === 'NOCHANGE') continue;
  let res;
  if (p.action === 'UPDATE') res = await sb.from('documents').update({ content: p.content, metadata: p.metadata }).eq('id', p.id).eq('category', 'hymn').select('id,reference,content').single();
  else res = await sb.from('documents').insert([{ reference: `Hymn ${p.number}`, source: 'CCC-Hymns latest(1).pdf', category: 'hymn', tenant_id: 'gbayo', content: p.content, metadata: p.metadata }]).select('id,reference,content').single();
  if (res.error || norm(res.data?.content) !== p.content) { bad++; console.error(`FAILED hymn ${p.number}: ${res.error?.message || 'read-back mismatch'}`); if (bad >= 3) { console.error('Stopping after 3 failures.'); break; } }
  else ok++;
}
console.log(`APPLIED: ${ok} ok, ${bad} failed. Embeddings were NOT changed; rows are tagged metadata.embedding_stale=true.`);
