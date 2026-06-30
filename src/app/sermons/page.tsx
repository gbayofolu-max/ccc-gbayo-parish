import { SermonCarousel } from "@/components/SermonCarousel";

export const metadata = {
  title: "Sermon Slides | CCC Gbayo Parish",
  description: "Browse and download the latest sermon slide decks.",
};

export default function SermonsPage() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-garamond text-gold mb-6">
        Sermon Slides
      </h1>

      <p className="text-gray-300 mb-4 font-inter">
        Swipe or click through our most recent sermon slide decks. Download the PDF
        to follow along.
      </p>

      <SermonCarousel />
    </section>
  );
}
