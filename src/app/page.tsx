// src/app/page.tsx
import HeroSection from "@/components/HeroSection";
import OurLegacy from "@/components/OurLegacy";
import DailyQuote from "@/components/DailyQuote";

export default function Home() {
  return (
    <>
      {/* ------------------- HERO ------------------- */}
      <HeroSection />

      {/* ------------------- DAILY BIBLE QUOTE (full‑width) ------------------- */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 py-12">
        <DailyQuote />
      </section>

      {/* ------------------- SCRIPTURE QUOTE (Jeremiah 29:11) ------------------- */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="font-serif text-2xl italic text-white md:text-3xl">
            “For I know the plans I have for you, declares the Lord, plans to prosper
            you and not to harm you, plans to give you hope and a future.”
          </p>
          <p className="mt-4 text-lg font-semibold text-gold">— Jeremiah 29:11</p>
        </div>
      </section>

      {/* ------------------- LEGACY SECTION ------------------- */}
      <OurLegacy />
    </>
  );
}