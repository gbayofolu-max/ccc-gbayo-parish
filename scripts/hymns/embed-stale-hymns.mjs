// embed-stale-hymns.mjs — regenerate embeddings for HYMN rows only (category='hymn', metadata.embedding_stale=true).
// Mirrors src/ai/embeddings/jina.ts exactly: model jina-embeddings-v3, input = row content, zero-padded to 1536.
//
//   node --env-file=.env.local scripts/hymns/embed-stale-hymns.mjs --validate=476
//        -> READ-ONLY check: embeds hymn 476's text again and compares it with the embedding already stored for it.
//           ~0.99+ means this script uses the same recipe as your site. Anything lower: stop and tell Claude.
//   node --env-file=.env.local scripts/hymns/embed-stale-hymns.mjs
//        -> DRY RUN: counts the stale hymn rows. Writes nothing.
//   node --env-file=.env.local scripts/hymns/embed-stale-hymns.mjs --apply --confirm=YES-WRITE --only=5
//        -> embeds hymn 5 only.   Drop --only=5 to do every stale hymn.
// Never touches any row outside category='hymn'. Never prints keys.
const args = process.argv.slice(2);
const flag = (n) => args.find((a) => a === `--${n}` || a.startsWith(`--${n}=`));
const val = (n) => { const f = flag(n); return f && f.includes('=') ? f.split('=').slice(1).join('=') : null; };
const APPLY = !!flag('apply');
const ONLY = val('only') ? new Set(val('only').split(',').map((x) => parseInt(x, 10))) : null;

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JINA = process.env.JINA_API_KEY;
if (!url || !key) { console.error('Missing Supabase URL or service key in .env.local'); process.exit(1); }
if (!JINA) { console.error('JINA_API_KEY missing in .env.local'); process.exit(1); }
const { createClient } = await import('@supabase/supabase-js');
const sb = createClient(url, key, { auth: { persistSession: false } });
const num = (ref) => { const m = /(\d{1,4})/.exec(ref || ''); return m ? parseInt(m[1], 10) : null; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function embedBatch(texts, attempt = 1) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 60000);
  try {
    const res = await fetch('https://api.jina.ai/v1/embeddings', {
      method: 'POST', headers: { Authorization: `Bearer ${JINA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'jina-embeddings-v3', input: texts }), signal: ctl.signal,
    });
    if (!res.ok) throw new Error(`Jina ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = await res.json();
    const items = [...json.data].sort((a, b) => a.index - b.index);
    if (items.length !== texts.length) throw new Error('Jina returned a different number of embeddings');
    return items.map((d) => { const p = new Array(1536).fill(0); for (let i = 0; i < d.embedding.length && i < 1536; i++) p[i] = d.embedding[i]; return p; });
  } catch (e) {
    if (attempt < 3) { await sleep(1500 * attempt); return embedBatch(texts, attempt + 1); }
    throw e;
  } finally { clearTimeout(t); }
}
const cosine = (a, b) => { let d = 0, x = 0, y = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; x += a[i] * a[i]; y += b[i] * b[i]; } return d / (Math.sqrt(x) * Math.sqrt(y)); };
const toVec = (s) => (Array.isArray(s) ? s : JSON.parse(s));

if (flag('validate')) {
  const n = parseInt(val('validate'), 10);
  const { data, error } = await sb.from('documents').select('id,reference,content,embedding').eq('category', 'hymn').eq('reference', `Hymn ${n}`).single();
  if (error || !data?.embedding) { console.error('Could not read hymn', n, error?.message || '(no stored embedding)'); process.exit(1); }
  const [fresh] = await embedBatch([data.content]);
  const c = cosine(fresh, toVec(data.embedding));
  console.log(`Hymn ${n}: cosine(new, stored) = ${c.toFixed(4)}  ->  ${c > 0.985 ? 'SAME RECIPE, safe to continue' : 'DIFFERENT RECIPE, do not continue'}`);
  process.exit(0);
}

let rows = []; 
for (let from = 0; ; from += 500) {
  const { data, error } = await sb.from('documents').select('id,reference,content,metadata').eq('category', 'hymn').eq('metadata->>embedding_stale', 'true').order('id').range(from, from + 499);
  if (error) { console.error('Query failed:', error.message); process.exit(1); }
  rows.push(...data); if (data.length < 500) break;
}
if (ONLY) rows = rows.filter((r) => ONLY.has(num(r.reference)));
console.log(`Stale hymn rows to embed: ${rows.length}`);
if (!APPLY) { console.log('DRY RUN: nothing written.'); process.exit(0); }
if (val('confirm') !== 'YES-WRITE') { console.error('Refusing to write: add --confirm=YES-WRITE'); process.exit(1); }

let ok = 0, bad = 0;
for (let i = 0; i < rows.length; i += 16) {
  const chunk = rows.slice(i, i + 16);
  let vecs; try { vecs = await embedBatch(chunk.map((r) => r.content)); } catch (e) { console.error('Jina failed:', e.message); break; }
  for (let j = 0; j < chunk.length; j++) {
    const r = chunk[j];
    const meta = { ...r.metadata, embedding_stale: false };
    const { error } = await sb.from('documents').update({ embedding: '[' + vecs[j].join(',') + ']', metadata: meta }).eq('id', r.id).eq('category', 'hymn');
    if (error) { bad++; console.error(`FAILED ${r.reference}: ${error.message}`); if (bad >= 3) { console.error('Stopping after 3 failures.'); process.exit(1); } } else ok++;
  }
  console.log(`  embedded ${Math.min(i + 16, rows.length)}/${rows.length}`);
}
console.log(`DONE: ${ok} ok, ${bad} failed.`);
