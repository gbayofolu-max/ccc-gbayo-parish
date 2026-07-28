// scripts/load-real-bible.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function loadBible() {
  console.log('📖 Loading real KJV Bible verses...');
  
  const bibleData = fs.readFileSync('data/kjv.tsv', 'utf-8');
  const verses = bibleData
    .split('\n')
    .filter(l => l.trim())
    .slice(1)
    .map(line => {
      const [book, chap, ver, ...textParts] = line.split('\t');
      return { 
        book, 
        chapter: parseInt(chap), 
        verse: parseInt(ver), 
        text: textParts.join('\t') 
      };
    })
    .filter(v => v.book && v.text);

  console.log(`Found ${verses.length} verses`);

  // Insert in batches
  for (let i = 0; i < verses.length; i += 50) {
    const batch = verses.slice(i, i + 50);
    const records = batch.map((v, idx) => ({
      id: i + idx + 1,
      title: `${v.book} ${v.chapter}:${v.verse}`,
      source: 'KJV Bible',
      chunk_index: idx,
      content: v.text,
      embedding: [],
      category: 'scripture',
      reference: `${v.book} ${v.chapter}:${v.verse}`,
      metadata: { book: v.book, chapter: v.chapter, verse: v.verse }
    }));

    const { error } = await supabase.from('documents')
      .upsert(records, { onConflict: 'id' });

    error 
      ? console.error(`Error at ${i/50 + 1}:`, error.message)
      : console.log(`✅ Batch ${i/50 + 1} inserted (${i + batch.length} total)`);
  }
  
  console.log('🎉 All verses loaded!');
}

loadBible().catch(console.error);
