import HeroSection from "@/components/HeroSection";
import QuickFacts from "@/components/QuickFacts";
import DailyVerse from "@/components/DailyVerse";
import LatestPostTeaser from "@/components/LatestPostTeaser";
import TodaysWordPopup from "@/components/TodaysWordPopup";
import NehemiahIntro from "@/components/NehemiahIntro";
import OurLegacy from "@/components/OurLegacy";
import ComingUp from "@/components/ComingUp";

export default function Home() {
  return (
    <>
      <TodaysWordPopup />

      <HeroSection />
      <QuickFacts />

      <section className="bg-linear-to-r from-navy via-navy-mid to-navy py-12 border-y border-gold/10">
        <DailyVerse />
      </section>

      <LatestPostTeaser />

      <NehemiahIntro />
      <OurLegacy />
      <ComingUp />
    </>
  );
}
