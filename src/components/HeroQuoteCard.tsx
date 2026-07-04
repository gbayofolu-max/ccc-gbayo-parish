// src/components/HeroQuoteCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { BookOpenIcon, SparklesIcon } from '@heroicons/react/24/outline';

const HeroQuoteCard = () => {
  const [quote, setQuote] = useState({ text: '', reference: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVerse = async () => {
      try {
        const res = await fetch('/api/verse');
        const data = await res.json();
        if (data.verse) {
          setQuote({ text: data.verse.text, reference: data.verse.reference });
        }
      } catch (e) {
        // Fallback to a curated default
        setQuote({
          text: 'Come to me, all you who are weary and burdened, and I will give you rest.',
          reference: 'Matthew 11:28'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchVerse();
  }, []);

  if (loading) return <div className="h-16 bg-emerald-50/30 rounded-lg animate-pulse" />;

  return (
    <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-900 to-emerald-800 text-white shadow-xl">
      <div className="flex items-start gap-3">
        <BookOpenIcon className="h-6 w-6 text-emerald-300 mt-1 flex-shrink-0" />
        <div>
          <p className="text-xl md:text-2xl font-serif italic leading-relaxed mb-2">
            “{quote.text}”
          </p>
          <p className="text-emerald-200 text-sm uppercase tracking-wider flex items-center gap-2">
            <SparklesIcon className="h-4 w-4" />
            {quote.reference}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroQuoteCard;