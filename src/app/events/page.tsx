export const metadata = {
  title: 'Events & Services – CCC Gbayo Parish',
  description: 'Weekly service schedule and upcoming events at Celestial Church of Christ Gbayo Parish, Ikorodu.',
};

const weeklySchedule = [
  { day: 'Tuesday', services: [{ time: '9:00 AM', name: 'Healing Service' }, { time: '6:00 PM', name: "Ushers' Meeting" }] },
  { day: 'Wednesday', services: [{ time: '9:00 AM', name: 'Service for the Needy' }, { time: '6:00 PM', name: 'Devotional Service' }] },
  { day: 'Thursday', services: [{ time: '12:00 Midnight', name: 'Prayer Warriors Vigil' }], note: 'Every first Thursday of the month is the New Moon Service.' },
  { day: 'Friday', services: [{ time: '12:00 Noon', name: 'Service for Prophets and Prophetesses' }, { time: '3:00 PM', name: 'Service for Pregnant Women' }, { time: '6:00 PM', name: 'Devotional Service' }] },
  { day: 'Saturday', services: [{ time: '4:00 PM', name: 'Church and Environment Cleaning Exercise' }, { time: '4:00 PM', name: 'Choir Rehearsal' }] },
  { day: 'Sunday', services: [{ time: '10:00 AM', name: 'Sunday Worship Service' }] },
];

const upcomingEvents = [
  { title: 'Celestial Church of Christ Worldwide Anniversary', date: 'September 29, 2026', icon: '🎉', description: "Join us as we celebrate another year of God's faithfulness." },
  { title: 'Adult Harvest Thanksgiving Service', date: 'December 13, 2026', icon: '🌾', description: 'A special thanksgiving service dedicated to giving glory to God.' },
];

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-r from-navy via-navy-mid to-navy py-20 text-center">
        <h1 className="font-serif text-4xl font-bold text-gold md:text-5xl">Events & Service Schedule</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">Join us in worship and fellowship.</p>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-20 space-y-20">
        <section>
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-bold text-navy md:text-4xl">Weekly Service Schedule</h2>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-gold" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {weeklySchedule.map((day) => (
              <div key={day.day} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition-shadow hover:shadow-xl">
                <div className="bg-gradient-to-r from-navy to-navy-mid px-6 py-4">
                  <h3 className="text-xl font-bold text-gold">{day.day}</h3>
                </div>
                <div className="p-6 space-y-4">
                  {day.services.map((service, idx) => (
                    <div key={idx} className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <span className="mt-0.5 shrink-0 text-lg">🕐</span>
                      <div>
                        <p className="text-sm font-semibold text-dark-gold">{service.time}</p>
                        <p className="font-medium text-gray-800">{service.name}</p>
                      </div>
                    </div>
                  ))}
                  {day.note && (
                    <div className="mt-3 rounded-lg bg-navy p-3 border-l-4 border-gold shadow-md">
                      <p className="text-sm font-semibold text-white italic">
                        📌 {day.note}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-bold text-navy md:text-4xl">Upcoming Events</h2>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-gold" />
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {upcomingEvents.map((event, idx) => (
              <div key={idx} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg p-8">
                <div className="h-2 bg-gold mb-4 rounded-full" />
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{event.icon}</span>
                  <p className="text-sm font-semibold text-dark-gold">📅 {event.date}</p>
                </div
                <h3 className="text-xl font-bold text-navy mb-3">{event.title}</h3>
                <p className="text-gray-600 leading-relaxed">{event.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}