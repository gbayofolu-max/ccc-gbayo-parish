import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative flex h-[90vh] w-full items-start justify-center overflow-hidden">
      {/* --------------------------------------------------- */}
      {/*  Background image (hero‑bg.jpg)                     */}
      {/* --------------------------------------------------- */}
      <Image
        src="/hero-bg.jpg"
        alt="CCC Gbayo Parish"
        fill
        className="object-cover"
        priority
      />

      {/* --------------------------------------------------- */}
      {/*  Veil – thin dark overlay to improve contrast       */}
      {/* --------------------------------------------------- */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60" />

      {/* --------------------------------------------------- */}
      {/*  Hero content - Shifted UP with pt-20               */}
      {/* --------------------------------------------------- */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center pt-20">
        
        {/* Logo - Reduced size for elegance */}
        <div className="mb-6">
          <Image
            src="/logo.png"
            alt="CCC Gbayo Parish logo"
            width={200}
            height={200}
            priority
            className="mx-auto object-contain drop-shadow-2xl"
          />
        </div>

        {/* Heading – Corrected tags here */}
        <h1 className="mb-6 font-serif text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl hero-heading-shadow">
          Welcome to{" "}
          <span className="text-gold hero-gold-shadow">
            CCC Gbayo Parish
          </span>
        </h1>

        {/* Motto */}
        <div className="mx-auto mb-10 max-w-2xl rounded-xl bg-black/60 px-8 py-5 backdrop-blur-sm">
          <p className="font-serif text-xl italic text-gold md:text-2xl hero-gold-shadow">
            &ldquo;And ye shall know the truth, and the truth shall make you free.&rdquo;
          </p>
          <p className="mt-2 text-sm text-white/70 hero-verse-shadow">
            — John 8:32
          </p>
        </div>

        {/* CTA button */}
        <Link
          href="/history"
          className="inline-flex items-center gap-3 rounded-full bg-gold px-10 py-4 text-lg font-semibold text-gray-900 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-dark-gold hover:shadow-xl"
        >
          Explore Our History
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
    </section>
  );
}