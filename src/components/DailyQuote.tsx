// src/components/DailyQuote.tsx
"use client";

import { useEffect, useState } from "react";
import { quotes } from "@/data/quotes";

export default function DailyQuote() {
  const [quote, setQuote] = useState<string>("");

  useEffect(() => {
    const day = new Date().getDate();
    const index = day % quotes.length;
    setQuote(quotes[index]);
  }, []);

  return (
    <p className="mx-auto max-w-2xl px-4 text-center text-2xl md:text-3xl font-serif italic text-gold drop-shadow-[0_2px_2px_rgba(0,0,0,0.7)]">
      {quote}
    </p>
  );
}