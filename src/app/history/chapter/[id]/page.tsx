'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { historyChapters } from '@/data/history';

export default function ChapterPage() {
  const params = useParams();
  const chapterId = parseInt(params.id as string);
  const chapterIndex = historyChapters.findIndex((c) => c.id === chapterId);
  const chapter = historyChapters[chapterIndex];

  if (!chapter) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-950 via-blue-900 to-blue-950">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">
            Chapter Not Found
          </h1>
          <p className="mb-8 text-gray-400">
            The chapter you are looking for does not exist.
          </p>
          <Link
            href="/history"
            className="rounded-lg bg-[#F5C518] px-8 py-3 text-lg font-semibold text-gray-900 hover:bg-[#D4A017]"
          >
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  const prevChapter = chapterIndex > 0 ? historyChapters[chapterIndex - 1] : null;
  const nextChapter =
    chapterIndex < historyChapters.length - 1
      ? historyChapters[chapterIndex + 1]
      : null;
  const progress = Math.round(((chapterIndex + 1) / historyChapters.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 via-blue-900 to-blue-950">
      {/* ── Sticky Progress Bar ── */}
      <div className="sticky top-0 z-50 h-1.5 bg-blue-800">
        <div
          className="h-full bg-gradient-to-r from-[#F5C518] to-[#D4A017] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Chapter Header ── */}
      <header className="py-16 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <Link
            href="/history"
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-[#F5C518]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to History
          </Link>
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-widest text-[#F5C518]">
            Chapter {chapter.id} of {historyChapters.length}
          </span>
          <h1 className="font-serif text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            {chapter.title}
          </h1>
          <p className="mt-3 text-xl text-white/70">{chapter.subtitle}</p>
          <p className="mt-2 text-sm text-[#F5C518]">{chapter.date}</p>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Article */}
          <div className="lg:col-span-2">
            <article className="rounded-2xl border border-blue-800/50 bg-blue-900/30 p-8 shadow-xl backdrop-blur-sm md:p-12">
              {/* Content Paragraphs */}
              <div className="space-y-6">
                {chapter.content.map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-lg leading-relaxed text-gray-300"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Related Scriptures */}
              <div className="mt-10 border-t border-blue-800 pt-8">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Related Scriptures
                </h3>
                <div className="flex flex-wrap gap-2">
                  {chapter.scriptures.map((scripture, index) => (
                    <span
                      key={index}
                      className="rounded-full border border-blue-700 bg-blue-800 px-4 py-2 text-sm font-medium text-[#F5C518]"
                    >
                      {scripture}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            {/* ── Navigation ── */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {prevChapter ? (
                <Link
                  href={`/history/chapter/${prevChapter.id}`}
                  className="group rounded-xl border border-blue-800/50 bg-blue-900/30 p-6 transition-all hover:bg-blue-800/40"
                >
                  <span className="flex items-center gap-2 text-sm text-gray-400">
                    <svg
                      className="h-4 w-4 transition-transform group-hover:-translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Previous Chapter
                  </span>
                  <h4 className="mt-2 text-lg font-bold text-white">
                    {prevChapter.title}
                  </h4>
                </Link>
              ) : (
                <Link
                  href="/history"
                  className="group rounded-xl border border-blue-800/50 bg-blue-900/30 p-6 transition-all hover:bg-blue-800/40"
                >
                  <span className="text-sm text-gray-400">Back to Overview</span>
                  <h4 className="mt-2 text-lg font-bold text-white">
                    History Home
                  </h4>
                </Link>
              )}

              {nextChapter ? (
                <Link
                  href={`/history/chapter/${nextChapter.id}`}
                  className="group rounded-xl border border-[#F5C518]/30 bg-blue-900/30 p-6 text-right transition-all hover:bg-blue-800/40"
                >
                  <span className="flex items-center justify-end gap-2 text-sm text-gray-400">
                    Next Chapter
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                  <h4 className="mt-2 text-lg font-bold text-white">
                    {nextChapter.title}
                  </h4>
                </Link>
              ) : (
                <Link
                  href="/history"
                  className="rounded-xl bg-[#F5C518] p-6 text-right transition-all hover:bg-[#D4A017]"
                >
                  <span className="text-sm text-gray-800">Journey Complete</span>
                  <h4 className="mt-2 text-lg font-bold text-gray-900">
                    Back to History
                  </h4>
                </Link>
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-8">
            {/* Chapter Image */}
            <div className="overflow-hidden rounded-2xl border border-blue-800/50 bg-blue-900/30 shadow-xl">
              <div className="relative h-64 w-full">
                <Image
                  src={chapter.imageSrc}
                  alt={chapter.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="bg-blue-900/50 p-4 text-center">
                <p className="text-sm font-semibold text-[#F5C518]">
                  {chapter.date}
                </p>
              </div>
            </div>

            {/* Chapter List */}
            <div className="rounded-2xl border border-blue-800/50 bg-blue-900/30 p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-bold text-white">
                All Chapters
              </h3>
              <nav className="space-y-2">
                {historyChapters.map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/history/chapter/${ch.id}`}
                    className={`block rounded-lg p-3 transition-colors ${
                      ch.id === chapter.id
                        ? 'bg-[#F5C518] font-semibold text-gray-900'
                        : 'text-gray-300 hover:bg-blue-800/50'
                    }`}
                  >
                    <span className="text-sm">Chapter {ch.id}</span>
                    <p className="font-medium">{ch.title}</p>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Back to Home */}
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-xl border border-blue-700 bg-blue-800 py-4 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Back to Home
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}