// compare-db-vs-master.mjs  — READ-ONLY. No database connection, no keys needed.
// Compares the exported DB hymn rows with the PDF-built master and writes a review report.
// Usage (Git Bash, from the repo root):
//   node scripts/hymns/compare-db-vs-master.mjs
// Reads : scripts/hymns/db-hymns-export.json  and  scripts/hymns/hymn-master-from-pdf.json
// Writes: scripts/hymns/db-vs-master-report.md  and  scripts/hymns/db-vs-master-report.csv
import { readFileSync, writeFileSync } from 'node:fs';

const DB = JSON.parse(readFileSync('scripts/hymns/db-hymns-export.json', 'utf8'));
const MASTER = JSON.parse(readFileSync('scripts/hymns/hymn-master-from-pdf.json', 'utf8')).hymns;

const num = (ref) => { const m = /(\d{1,4})/.exec(ref || ''); return m ? parseInt(m[1], 10) : null; };
const SOLFA = /^\s*(?:cr\s*:?\s*)?(?:[drmfslt][ie]?['’,]?\d?\s*[:!|;.\-]?\s*){3,}$/i;

function bag(text, { dropNumbersPrefix = true } = {}) {
  const words = [];
  for (let line of String(text || '').split('\n')) {
    line = line.trim();
    if (!line) continue;
    if (SOLFA.test(line)) continue;                       // music notation
    if (/(?:are|is)\s+rese?r[vy]ed/i.test(line)) continue; // reserved notices
    if (dropNumbersPrefix) line = line.replace(/^\d{1,3}\s*[.:]\s*\d?\s*[.:]?\s*/, '');
    for (const w of line.toLowerCase().replace(/[’‘`"”“]/g, "'").split(/[^a-z']+/)) {
      const t = w.replace(/^'+|'+$/g, '');
      if (t.length >= 2) words.push(t);
    }
  }
  const m = new Map(); for (const w of words) m.set(w, (m.get(w) || 0) + 1);
  return m;
}
function dice(a, b) {
  let inter = 0, ta = 0, tb = 0;
  for (const v of a.values()) ta += v; for (const v of b.values()) tb += v;
  for (const [k, v] of a) if (b.has(k)) inter += Math.min(v, b.get(k));
  return ta + tb === 0 ? 1 : (2 * inter) / (ta + tb);
}
const dbStyle = (r) => (r.metadata && r.metadata.chunk_index !== undefined ? 'ocr' : 'manual');
const damaged = (t) => /(?:are|is)\s+rese?r[vy]ed|\bHymns?\s+\d+\s*[-–—]\s*\d+|^[-»]\s|\n[-»]\s/m.test(t);

const dbBy = new Map(); const dupDb = [];
for (const r of DB) { const n = num(r.reference); if (n == null) continue; if (dbBy.has(n)) dupDb.push(n); dbBy.set(n, r); }
const rows = []; const csv = [['number','status','db_id','db_style','db_looks_damaged','similarity','master_flags','note']];
const add = (o) => { rows.push(o); csv.push([o.number,o.status,o.db_id ?? '',o.db_style ?? '',o.damaged ?? '',o.sim ?? '',(o.flags||[]).join('|'),o.note ?? '']); };

for (const h of MASTER) {
  const r = dbBy.get(h.number);
  if (h.status === 'present' && h.ready_for_sync) {
    if (!r) { add({ number: h.number, status: 'MISSING_IN_DB', flags: h.flags, note: 'would be a new row' }); continue; }
    const mt = h.yoruba + '\n' + h.english;
    const sim = dice(bag(r.content), bag(mt));
    const st = dbStyle(r), dmg = damaged(r.content);
    let status = sim >= 0.995 ? 'SAME' : sim >= 0.93 ? 'MINOR_DIFF' : sim >= 0.75 ? 'MODERATE_DIFF' : 'MAJOR_DIFF';
    add({ number: h.number, status, db_id: r.id, db_style: st, damaged: dmg, sim: +sim.toFixed(3), flags: h.flags,
          note: st === 'manual' && sim < 0.93 ? 'DB row looks hand-pasted: review before replacing' : '' });
  } else if (r) {
    add({ number: h.number, status: 'KEEP_DB_NOT_IN_PDF', db_id: r.id, db_style: dbStyle(r), flags: h.flags,
          note: h.status === 'present' ? 'PDF text blocked (' + h.flags.join(',') + ')' : 'PDF has no hymn here (' + h.status + ')' });
  }
}
for (const [n, r] of dbBy) if (n < 1 || n > 978) add({ number: n, status: 'DB_NUMBER_OUT_OF_RANGE', db_id: r.id });

const by = (s) => rows.filter((r) => r.status === s);
const list = (a) => a.map((r) => r.number).join(', ') || '—';
const counts = {}; for (const r of rows) counts[r.status] = (counts[r.status] || 0) + 1;
const manualRisk = rows.filter((r) => ['MODERATE_DIFF','MAJOR_DIFF'].includes(r.status) && r.db_style === 'manual');
const damagedDb = rows.filter((r) => r.damaged).length;

let md = `# DB hymns vs PDF master\n\nDB rows: ${DB.length}. Master positions ready to sync: ${MASTER.filter(h => h.ready_for_sync).length}.\n\n## Summary\n`;
for (const [k, v] of Object.entries(counts)) md += `- ${k}: ${v}\n`;
md += `- DB rows that still carry OCR junk (reserved notices, stray marks): ${damagedDb}\n- Duplicate DB references: ${dupDb.length ? dupDb.join(', ') : 'none'}\n\n`;
md += `## Needs your eyes first: hand-pasted DB rows that differ from the PDF (${manualRisk.length})\n${list(manualRisk)}\n\n`;
md += `## MISSING_IN_DB (new rows)\n${list(by('MISSING_IN_DB'))}\n\n## KEEP_DB_NOT_IN_PDF (left untouched)\n${list(by('KEEP_DB_NOT_IN_PDF'))}\n\n`;
md += `## MAJOR_DIFF (similarity < 0.75)\n${list(by('MAJOR_DIFF'))}\n\n## MODERATE_DIFF (0.75–0.93)\n${list(by('MODERATE_DIFF'))}\n\n## MINOR_DIFF / SAME\nMINOR_DIFF: ${list(by('MINOR_DIFF'))}\nSAME: ${list(by('SAME'))}\n`;
writeFileSync('scripts/hymns/db-vs-master-report.md', md);
writeFileSync('scripts/hymns/db-vs-master-report.csv', '\ufeff' + csv.map((c) => c.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n'));
console.log(md.split('\n## Needs')[0]);
console.log('Wrote scripts/hymns/db-vs-master-report.md and .csv');
