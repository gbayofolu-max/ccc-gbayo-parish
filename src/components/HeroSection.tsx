import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative flex h-[90vh] w-full items-center justify-center overflow-hidden">
      <Image
        src="/hero-bg.jpg"
        alt="CCC Gbayo Parish"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/65 to-black/85" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo.png"
            alt="CCC Gbayo Parish logo"
            width={100}
            height={100}
            priority
            className="object-contain drop-shadow-2xl"
          />
        </div>

        <div className="inline-block mb-6 rounded-xl bg-black/50 px-6 py-4 backdrop-blur-sm border border-white/10">
          <h1 className="font-serif text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl"
              style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 4px 14px rgba(0,0,0,0.8)' }}>
            Welcome to{" "}
            <span className="text-gold">CCC Gbayo Parish</span>
          </h1>
        </div>

        <div className="mx-auto mb-8 max-w-2xl rounded-xl bg-black/70 px-6 py-4 backdrop-blur-md border border-white/10">
          <p className="font-serif text-lg italic text-gold md:text-xl drop-shadow-md">
            &ldquo;And ye shall know the truth, and the truth shall make you free.&rdquo;
          </p>
          <p className="mt-1 text-sm text-white/80 font-medium">
            — John 8:32
          </p>
        </div>

        <Link
          href="/history"
          className="inline-flex items-center gap-3 rounded-full bg-gold px-8 py-3.5 text-base font-bold text-gray-900 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-dark-gold hover:shadow-xl"
        >
          Explore Our History
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
}