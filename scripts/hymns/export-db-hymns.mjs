import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Missing Supabase URL or service key in .env.local'); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });
const rows = [];
for (let from = 0; ; from += 500) {
  const { data, error } = await sb.from('documents')
    .select('id, reference, source, category, metadata, content')
    .eq('category', 'hymn').order('id').range(from, from + 499);
  if (error) { console.error('Query failed:', error.message); process.exit(1); }
  rows.push(...data);
  if (data.length < 500) break;
}
writeFileSync('scripts/hymns/db-hymns-export.json', JSON.stringify(rows, null, 1));
console.log('hymn rows exported:', rows.length);
