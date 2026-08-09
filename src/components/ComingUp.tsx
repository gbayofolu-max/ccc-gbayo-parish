import Link from "next/link";

const events = [
  { title: "Father's Remembrance / Amisa Service", date: "November 28, 2026" },
  { title: "Adult Harvest Thanksgiving Service", date: "December 13, 2026 (2nd Sunday)" },
];

const sermons = [
  { title: "True Worship: Honouring God with Both Heart and Life", reference: "Deuteronomy 5:11–16 · Matthew 15:1–9" },
  { title: "The Voice You Believe", reference: "Genesis 3:1–16 · Luke 1:36–38" },
  { title: "Divine Order vs Human Substitute", reference: "2 Kings 16:1–8 · Ephesians 6:1–8" },
];

export default function ComingUp() {
  return (
    <section className="bg-white py-20 px-6">
      <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12">

        <div>
          <h3 className="font-serif text-2xl font-bold text-navy mb-6">Upcoming Events</h3>
          <div className="space-y-4">
            {events.map((e) => (
              <div key={e.title} className="border-l-4 border-gold pl-4 py-1">
                <p className="text-dark-gold text-sm font-semibold">{e.date}</p>
                <p className="text-navy font-medium">{e.title}</p>
              </div>
            ))}
          </div>
          <Link href="/events" className="inline-block mt-6 text-sm font-semibold text-dark-gold hover:text-gold underline underline-offset-4">
            View full calendar →
          </Link>
        </div>

        <div>
          <h3 className="font-serif text-2xl font-bold text-navy mb-6">From Recent Sermons</h3>
          <div className="space-y-4">
            {sermons.map((s) => (
              <div key={s.title} className="border-l-4 border-navy-light pl-4 py-1">
                <p className="text-navy font-medium">{s.title}</p>
                <p className="text-gray-500 text-sm">{s.reference}</p>
              </div>
            ))}
          </div>
          <Link href="/sermons" className="inline-block mt-6 text-sm font-semibold text-dark-gold hover:text-gold underline underline-offset-4">
            Browse all sermons →
          </Link>
        </div>

      </div>
    </section>
  );
}