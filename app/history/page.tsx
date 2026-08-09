'use client';

import { useState } from 'react';
import { historyChapters, HistoryChapter } from '@/data/history';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon, BookOpenIcon } from '@heroicons/react/24/outline';

export default function HistoryPage() {
  const [currentChapterId, setCurrentChapterId] = useState(1);

  // Find the current chapter based on the state
  const chapter = historyChapters.find((c) => c.id === currentChapterId) || historyChapters[0];

  const nextChapter = () => {
    if (currentChapterId < historyChapters.length) {
      setCurrentChapterId(currentChapterId + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevChapter = () => {
    if (currentChapterId > 1) {
      setCurrentChapterId(currentChapterId - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* --- SACRED HEADER --- */}
      <header className="relative h-[40vh] flex items-center justify-center overflow-hidden bg-navy">
        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
        <div className="relative z-10 text-center px-4">
          <BookOpenIcon className="h-12 w-12 text-gold mx-auto mb-4 animate-bounce-slow" />
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-gold mb-2">The Legacy</h1>
          <p className="text-white/80 italic font-serif text-lg">Life and Ministry of Rev. Henry Moronfolu Gbayo</p>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </header>

      {/* --- THE DIGITAL BOOK --- */}
      <main className="max-w-4xl mx-auto px-6 -mt-12 relative z-20">
        <div className="bg-white shadow-2xl rounded-t-3xl rounded-b-lg border-t-8 border-gold overflow-hidden">
          
          {/* Chapter Navigation Progress */}
          <div className="flex justify-between px-8 pt-6 text-[10px] uppercase tracking-widest text-gray-400 font-bold">
            <span>Chapter {chapter.id} of {historyChapters.length}</span>
            <span>{chapter.date}</span>
          </div>

          {/* Image Section */}
          <div className="relative h-64 md:h-96 w-full">
            <Image 
              src={chapter.imageSrc} 
              alt={chapter.title} 
              fill 
              className="object-cover object-top w-full h-full"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
          </div>

          {/* Content Section */}
          <div className="p-8 md:p-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-navy mb-2">
                {chapter.title}
              </h2>
              <p className="text-gold font-medium italic text-lg">{chapter.subtitle}</p>
              <div className="w-24 h-1 bg-gold mx-auto mt-4 rounded-full opacity-50"></div>
            </div>

            <div className="space-y-6 text-gray-700 leading-relaxed text-lg font-serif">
              {chapter.content.map((paragraph, index) => (
                <p key={index} className="first-letter:text-4xl first-letter:font-bold first-letter:text-navy first-letter:mr-1">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Scripture Box */}
            {chapter.scriptures.length > 0 && (
              <div className="mt-12 p-6 bg-navy/5 border-l-4 border-gold rounded-r-lg italic">
                <p className="text-navy font-serif font-bold mb-2">Divine Anchors:</p>
                <div className="flex flex-wrap gap-3">
                  {chapter.scriptures.map((s) => (
                    <span key={s} className="text-sm bg-white px-3 py-1 rounded-full border border-gold/30 text-navy shadow-sm">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* --- PAGINATION CONTROLS --- */}
          <div className="flex items-center justify-between p-8 bg-slate-50 border-t border-gray-100">
            <button 
              onClick={prevChapter}
              disabled={currentChapterId === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
                currentChapterId === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-navy hover:bg-gold/20'
              }`}
            >
              <ChevronLeftIcon className="h-5 w-5" /> Previous
            </button>

            <div className="hidden md:flex gap-2">
              {historyChapters.map((c) => (
                <div 
                  key={c.id} 
                  className={`h-2 w-2 rounded-full transition-all ${c.id === currentChapterId ? 'bg-gold w-4' : 'bg-gray-300'}`}
                />
              ))}
            </div>

            <button 
              onClick={nextChapter}
              disabled={currentChapterId === historyChapters.length}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
                currentChapterId === historyChapters.length ? 'text-gray-300 cursor-not-allowed' : 'text-navy hover:bg-gold/20'
              }`}
            >
              Next <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}