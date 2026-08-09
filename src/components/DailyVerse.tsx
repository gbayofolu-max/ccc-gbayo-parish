import { supabaseAdmin } from '@/lib/supabase/server';

const TOTAL_VERSES = 30205; // category='scripture' row count

function getSeedIndex(): number {
  // Lagos is UTC+1, fixed offset, no DST
  const now = new Date();
  const lagosHour = (now.getUTCHours() + 1) % 24;
  const half = lagosHour < 12 ? 'AM' : 'PM';
  const dateKey = now.toISOString().slice(0, 10); // YYYY-MM-DD (UTC date is fine here)
  const seedString = `${dateKey}-${half}`;

  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash * 31 + seedString.charCodeAt(i)) >>> 0;
  }
  return hash % TOTAL_VERSES;
}

export default async function DailyVerse() {
  const index = getSeedIndex();

  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('content, reference')
    .eq('category', 'scripture')
    .order('id', { ascending: true })
    .range(index, index)
    .single();

  const verse = error || !data
    ? { content: 'Come to me, all you who are weary and burdened, and I will give you rest.', reference: 'Matthew 11:28' }
    : data;

  return (
    <div className="mx-auto max-w-2xl px-4 text-center">
      <p className="text-2xl md:text-3xl font-serif italic text-gold drop-shadow-[0_2px_2px_rgba(0,0,0,0.7)]">
        &ldquo;{verse.content}&rdquo;
      </p>
      <p className="mt-3 text-sm uppercase tracking-widest text-gold/70">
        {verse.reference}
      </p>
    </div>
  );
}