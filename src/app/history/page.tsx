import Link from "next/link";
import { historyChapters } from "@/data/history";
import HeritageSection from "@/components/HeritageSection";

/* --------------------------------------------------------------- *
 *  History landing page – now includes the clean HeritageSection
 * --------------------------------------------------------------- */
export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* ── Page Header ── */}
      <section className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 py-20 text-center">
        <h1 className="font-serif text-4xl font-bold text-[#F5C518] md:text-5xl">
          Our History &amp; Legacy
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
          The inspiring life story of Rev. Henry Moronfolu Gbayo, founder of
          Celestial Church of Christ Gbayo Parish, Ikorodu.
        </p>
      </section>

      {/* ── Scripture Quote ── */}
      <section className="border-y border-[#F5C518]/30 bg-[#F5C518]/10 py-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="font-serif text-xl italic text-blue-950 md:text-2xl">
            &ldquo;Remember them which have the rule over you, who have spoken
            unto you the word of God: whose faith follow, considering the end of
            their conversation.&rdquo;
          </p>
          <p className="mt-3 font-semibold text-[#D4A017]">
            — Hebrews 13:7
          </p>
        </div>
      </section>

      {/* ── **NEW** Heritage Section (only the three cards) ── */}
      <HeritageSection />

      {/* ── Chapter Listing (unchanged) ── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-bold text-blue-950">
              The Full Story
            </h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#F5C518]" />
            <p className="mt-4 text-gray-600">
              Read the complete story from beginning to end.
            </p>
          </div>

          <div className="space-y-4">
            {historyChapters.map((chapter) => (
              <Link
                key={chapter.id}
                href={`/history/chapter/${chapter.id}`}
                className="group block rounded-xl border border-gray-200 bg-white p-6 shadow-md transition-all hover:border-[#F5C518]/50 hover:shadow-lg"
              >
                <div className="flex items-center gap-5">
                  {/* Chapter number */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-900 to-blue-800">
                    <span className="text-lg font-bold text-[#F5C518]">
                      {chapter.id}
                    </span>
                  </div>

                  {/* Title & subtitle */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-blue-950 transition-colors group-hover:text-[#D4A017]">
                      {chapter.title}
                    </h3>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {chapter.subtitle}
                    </p>
                  </div>

                  {/* Arrow */}
                  <svg
                    className="h-5 w-5 shrink-0 text-gray-400 transition-colors group-hover:text-[#F5C518]"
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
                </div>
              </Link>
            ))}
          </div>

          {/* CTA – Begin Reading */}
          <div className="mt-12 text-center">
            <Link
              href="/history/chapter/1"
              className="inline-flex items-center gap-3 rounded-full bg-[#F5C518] px-10 py-4 text-lg font-semibold text-blue-950 shadow-lg transition-all hover:bg-[#D4A017] hover:shadow-xl"
            >
              Begin Reading from Chapter 1
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
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Declaration (unchanged) ── */}
      <section className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 py-20 text-center">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-serif text-3xl font-bold text-[#F5C518] md:text-4xl">
            Our Declaration
          </h2>
          <p className="mt-6 text-xl text-white/90">
            Celestial Church of Christ Gbayo Parish is a Spirit‑filled church
            where everybody is somebody and Jesus reigns supreme.
          </p>
          <p className="mt-4 text-lg text-white/70">
            Since 17 March 1996, we have remained committed to worshipping God in
            spirit and in truth, preserving the legacy of our founder, and
            preparing believers for the ultimate goal:
          </p>
          <p className="mt-6 font-serif text-4xl font-bold text-[#F5C518]">
            HEAVEN.
          </p>
          <p className="mt-8 font-serif text-lg italic text-white/70">
            “I have fought a good fight, I have finished my course, I have kept
            the faith.” — 2 Timothy 4:7
          </p>
          <p className="mt-6 text-white/80">
            <strong>Rev. Henry Moronfolu Gbayo (1945–2007)</strong>
            <br />
            <span className="text-[#F5C518]">
              A faithful servant, a loving shepherd, and a lasting legacy.
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}