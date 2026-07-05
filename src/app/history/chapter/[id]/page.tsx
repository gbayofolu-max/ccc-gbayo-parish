'use client';

import { historyChapters } from "@/data/history";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";

export default function ChapterPage() {
  const params = useParams();
  const id = params.id as string;
  const chapterId = parseInt(id);
  
  // Find the chapter data based on the ID in the URL
  const chapter = historyChapters.find(c => c.id === chapterId);

  if (!chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-navy mb-4">Chapter Not Found</h1>
          <Link href="/history" className="text-gold underline">Return to History Archive</Link>
        </div>
      </div>
    );
  }

  // Navigation logic
  const prevChapter = historyChapters.find(c => c.id === chapterId - 1);
  const nextChapter = historyChapters.find(c => c.id === chapterId + 1);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gold/30">
        
        {/* Chapter Image */}
        <div className="relative h-64 md:h-80 w-full">
          <Image 
            src={chapter.imageSrc} 
            alt={chapter.title} 
            fill 
            className="object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent" />
        </div>

        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-gold font-bold uppercase tracking-widest text-xs">
              Chapter {chapter.id}
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-navy mt-2">
              {chapter.title}
            </h1>
            <p className="text-gray-500 italic mt-2">{chapter.date}</p>
            <div className="mx-auto mt-4 h-1 w-12 bg-gold rounded-full" />
          </div>

          {/* Content - This maps through your string array in history.ts */}
          <div className="space-y-6 text-lg text-gray-800 leading-relaxed font-sans">
            {chapter.content.map((paragraph, index) => (
              <p key={index} className="text-justify first-letter:text-3xl first-letter:font-serif first-letter:font-bold first-letter:text-navy">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Scriptures Section */}
          {chapter.scriptures.length > 0 && (
            <div className="mt-10 p-6 bg-gold/10 rounded-2xl border-l-4 border-gold italic text-navy">
              <p className="font-bold mb-2">Scriptural Foundations:</p>
              <div className="flex flex-wrap gap-3">
                {chapter.scriptures.map((s, i) => (
                  <span key={i} className="text-sm bg-white px-3 py-1 rounded-full shadow-sm border border-gold/20">
                    📖 {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center">
            {prevChapter ? (
              <Link 
                href={`/history/chapter/${prevChapter.id}`} 
                className="px-6 py-2 rounded-full border border-navy text-navy hover:bg-navy hover:text-white transition-all text-sm font-bold"
              >
                ← Previous
              </Link>
            ) : (
              <div /> 
            )}

            <Link href="/history" className="text-sm text-gray-400 hover:text-navy underline">
              Archive
            </Link>

            {nextChapter ? (
              <Link 
                href={`/history/chapter/${nextChapter.id}`} 
                className="px-6 py-2 rounded-full bg-gold text-navy font-bold hover:bg-dark-gold transition-all text-sm"
              >
                Next Chapter →
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
🛠️ Final "Clean-Up" and Git Fix
Since your events and announcements pages a