import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

let embedder: any = null;

async function getEmbedder() {
  if (!embedder) {
    const { pipeline } = await import('@xenova/transformers');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true });
  }
  return embedder;
}

async function embedText(text: string): Promise<number[]> {
  const extractor = await getEmbedder();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  const vec384 = Array.from(output.data) as number[];
  const padded = new Array(1536).fill(0);
  for (let i = 0; i < vec384.length; i++) padded[i] = vec384[i];
  return padded;
}

async function reembedAll() {
  const { data: docs, error } = await supabase.from('documents').select('id, content');
  if (error) { console.error('❌ Fetch failed:', error); return; }

  console.log(`📄 Re-embedding ${docs?.length ?? 0} documents...`);

  for (const doc of docs ?? []) {
    const embedding = await embedText(doc.content);
    const { error: upErr } = await supabase.from('documents').update({ embedding }).eq('id', doc.id);
    if (upErr) console.error(`❌ Doc #${doc.id} failed:`, upErr);
    else console.log(`✅ Doc #${doc.id} done`);
  }
  console.log('🎉 All documents re-embedded!');
}

reembedAll().catch(console.error);
