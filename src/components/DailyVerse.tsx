// TEMPORARY MITIGATION: the `documents` table's scripture rows are corrupted
// (see project notes — only 5 distinct verse bodies exist across ~30,205 rows,
// each duplicated under thousands of wrong references). This component was
// switched from querying Supabase to a small static, hand-verified verse set
// until the verse table is re-ingested from a clean KJV source. Revert this
// once that fix lands.

const VERSES: { content: string; reference: string }[] = [
  { content: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', reference: 'John 3:16' },
  { content: 'In the beginning God created the heaven and the earth.', reference: 'Genesis 1:1' },
  { content: 'The Lord is my shepherd; I shall not want.', reference: 'Psalm 23:1' },
  { content: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding.', reference: 'Proverbs 3:5' },
  { content: 'I can do all things through Christ which strengtheneth me.', reference: 'Philippians 4:13' },
  { content: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.', reference: 'Matthew 11:28' },
  { content: 'Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest.', reference: 'Joshua 1:9' },
  { content: 'Delight thyself also in the Lord; and he shall give thee the desires of thine heart.', reference: 'Psalm 37:4' },
  { content: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.', reference: 'Romans 8:28' },
  { content: 'Trust in the Lord for ever: for in the Lord Jehovah is everlasting strength.', reference: 'Isaiah 26:4' },
  { content: 'This is the day which the Lord hath made; we will rejoice and be glad in it.', reference: 'Psalm 118:24' },
  { content: 'For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end.', reference: 'Jeremiah 29:11' },
  { content: 'Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.', reference: 'Matthew 7:7' },
  { content: 'The Lord is my light and my salvation; whom shall I fear? the Lord is the strength of my life; of whom shall I be afraid?', reference: 'Psalm 27:1' },
  { content: 'Rejoice in the Lord alway: and again I say, Rejoice.', reference: 'Philippians 4:4' },
];

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
  return hash % VERSES.length;
}

export default function DailyVerse() {
  const verse = VERSES[getSeedIndex()];
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
