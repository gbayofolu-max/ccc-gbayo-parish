import Link from "next/link";

export default function QuickFacts() {
  return (
    <section className="bg-navy border-b border-gold/20 py-6">
      <div className="mx-auto max-w-5xl px-6 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-center md:text-left">

        <div className="flex items-center gap-3">
          <span className="text-2xl">🕙</span>
          <div>
            <p className="text-gold font-serif font-bold text-lg leading-tight">Sunday Worship</p>
            <p className="text-white/70 text-sm">10:00 AM</p>
          </div>
        </div>

        <div className="hidden md:block h-10 w-px bg-gold/20" />

        <div className="flex items-center gap-3">
          <span className="text-2xl">📍</span>
          <div>
            <p className="text-gold font-serif font-bold text-lg leading-tight">Ikorodu, Lagos</p>
            <p className="text-white/70 text-sm">Igboluwo Estate, Jumofak Bus Stop</p>
          </div>
        </div>

        <div className="hidden md:block h-10 w-px bg-gold/20" />

        <div className="flex items-center gap-4 text-sm font-semibold">
          <Link href="/events" className="text-gold hover:text-dark-gold underline underline-offset-4">
            Full Schedule
          </Link>
          <Link href="/contact" className="text-gold hover:text-dark-gold underline underline-offset-4">
            Get Directions
          </Link>
        </div>

      </div>
    </section>
  );
}