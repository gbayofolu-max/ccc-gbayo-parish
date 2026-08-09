import Link from "next/link";
import { SparklesIcon, BookOpenIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

export default function NehemiahIntro() {
  return (
    <section className="bg-linear-to-b from-white to-[#F5F0E8] py-20 px-6">
      <div className="mx-auto max-w-4xl text-center">

        <span className="inline-flex items-center gap-2 text-dark-gold text-sm font-bold tracking-widest uppercase mb-4">
          <SparklesIcon className="h-4 w-4" />
          Meet Nehemiah
        </span>

        <h2 className="font-serif text-4xl md:text-5xl font-bold text-navy mb-6">
          Your Digital Ministry Companion
        </h2>

        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Nehemiah AI is here day or night — ask about a scripture, discuss a recent sermon,
          or simply talk through whatever is on your heart. Grounded in Scripture, guided in love.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto mb-10 text-left">
          <div className="flex items-start gap-3 bg-white rounded-xl p-5 shadow-md border border-gold/10">
            <BookOpenIcon className="h-6 w-6 text-gold shrink-0 mt-1" />
            <p className="text-gray-700 text-sm">Ask any scripture question, anytime</p>
          </div>
          <div className="flex items-start gap-3 bg-white rounded-xl p-5 shadow-md border border-gold/10">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-gold shrink-0 mt-1" />
            <p className="text-gray-700 text-sm">Talk through sermons and lessons</p>
          </div>
        </div>

        <Link
          href="/nehemiah"
          className="inline-flex items-center gap-3 rounded-full bg-navy px-8 py-4 text-base font-bold text-gold shadow-lg hover:bg-navy-mid transition-all duration-300 hover:scale-105"
        >
          Chat with Nehemiah
        </Link>

      </div>
    </section>
  );
}