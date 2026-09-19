export const metadata = {
  title: 'Live Worship – CCC Gbayo Parish',
  description: 'Join CCC Gbayo Parish for live worship online — Sunday Worship Service and other services streamed live from Ikorodu, Lagos.',
};

const YOUTUBE_CHANNEL_ID = 'UCOh4DBcaHJqDCCJrL8w2vKA';

const weeklySchedule = [
  { day: 'Tuesday', services: [{ time: '9:00 AM', name: 'Healing Service' }, { time: '6:00 PM', name: "Ushers' Meeting" }] },
  { day: 'Wednesday', services: [{ time: '9:00 AM', name: 'Service for the Needy' }, { time: '6:00 PM', name: 'Devotional Service' }] },
  { day: 'Thursday', services: [{ time: '12:00 Midnight', name: 'Prayer Warriors Vigil' }], note: 'Every first Thursday of the month is the New Moon Service.' },
  { day: 'Friday', services: [{ time: '12:00 Noon', name: 'Service for Prophets and Prophetesses' }, { time: '3:00 PM', name: 'Service for Pregnant Women' }, { time: '6:00 PM', name: 'Devotional Service' }] },
  { day: 'Saturday', services: [{ time: '4:00 PM', name: 'Church and Environment Cleaning Exercise' }, { time: '4:00 PM', name: 'Choir Rehearsal' }] },
  { day: 'Sunday', services: [{ time: '10:00 AM', name: 'Sunday Worship Service' }] },
];

export default function LivePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-navy via-navy-mid to-navy py-20 text-center">
        <h1 className="font-serif text-4xl font-bold text-gold md:text-5xl">Worship With Us Live</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
          Wherever you are, you can pray, worship, grow, and serve with CCC Gbayo Parish.
        </p>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-20 space-y-20">
        {/* Live Player */}
        <section>
          <div className="overflow-hidden rounded-2xl border border-navy-light/20 bg-navy shadow-xl">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/live_stream?channel=${YOUTUBE_CHANNEL_ID}`}
                title="CCC Gbayo Parish Live Worship"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-navy-light/70">
            Not seeing a live video? We're not streaming right now — check our schedule below, or watch past services on our{' '}
            <a
              href={`https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-dark-gold underline hover:text-gold"
            >
              YouTube channel
            </a>.
          </p>
        </section>

        {/* Main Sunday Highlight */}
        <section className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-lg md:p-12">
          <h2 className="font-serif text-2xl font-bold text-navy md:text-3xl">Main Sunday Worship Service</h2>
          <p className="mt-2 text-lg text-navy-light">Every Sunday, 10:00 AM (Lagos time)</p>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gold" />
          <p className="mt-4 text-navy-light/80">
            This is our main weekly gathering — but every service throughout the week is open to you, whether in person or online.
          </p>
        </section>

        {/* Full Weekly Schedule */}
        <section>
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-bold text-navy md:text-4xl">Full Weekly Schedule</h2>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-gold" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {weeklySchedule.map((day) => (
              <div key={day.day} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition-shadow hover:shadow-xl">
                <div className="bg-gradient-to-r from-navy to-navy-mid px-6 py-4">
                  <h3 className="text-xl font-bold text-gold">{day.day}</h3>
                </div>
                <div className="space-y-3 px-6 py-5">
                  {day.services.map((s) => (
                    <div key={s.name} className="flex justify-between gap-4 text-sm">
                      <span className="font-medium text-navy">{s.name}</span>
                      <span className="whitespace-nowrap text-navy-light/70">{s.time}</span>
                    </div>
                  ))}
                  {day.note && (
                    <p className="mt-2 border-t border-gray-100 pt-2 text-xs italic text-dark-gold">📌 {day.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-2xl bg-gradient-to-r from-navy via-navy-mid to-navy p-8 text-center shadow-xl md:p-12">
          <h2 className="font-serif text-2xl font-bold text-gold md:text-3xl">Questions or Prayer Requests?</h2>
          <p className="mt-4 text-white/80">Reach out to us directly — we'd love to hear from you.</p>
          <a
            href="tel:+2348035697667"
            className="mt-6 inline-block rounded-full bg-gold px-8 py-3 font-semibold text-navy shadow-glow transition-transform hover:scale-105"
          >
            📞 +234 803 569 7667
          </a>
        </section>
      </div>
    </main>
  );
}
