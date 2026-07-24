import HeroSection from "@/components/HeroSection";
import OurLegacy from "@/components/OurLegacy";
import DailyQuote from "@/components/DailyQuote";

export default function Home() {
  return (
    <>
      {/* The refined HeroSection with logo and text shifted up */}
      <HeroSection />

      {/* Daily Bible Quote - The only dynamic quote section */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 py-12">
        <DailyQuote />
      </section>

      {/* Legacy Section */}
      <OurLegacy />
    </>
  );
}