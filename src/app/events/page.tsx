export const metadata = {
  title: 'Events & Services – CCC Gbayo Parish',
  description:
    'Weekly service schedule and upcoming events at Celestial Church of Christ Gbayo Parish, Ikorodu.',
};

const weeklySchedule = [
  {
    day: 'Tuesday',
    services: [
      { time: '9:00 AM', name: 'Healing Service' },
      { time: '6:00 PM', name: "Ushers' Meeting" },
    ],
  },
  {
    day: 'Wednesday',
    services: [
      { time: '9:00 AM', name: 'Service for the Needy' },
      { time: '6:00 PM', name: 'Devotional Service' },
    ],
  },
  {
    day: 'Thursday',
    services: [{ time: '12:00 Midnight', name: 'Prayer Warriors Vigil' }],
    note: 'Every first Thursday of the month is the New Moon Service.',
  },
  {
    day: 'Friday',
    services: [
      { time: '12:00 Noon', name: 'Service for Prophets and Prophetesses' },
      { time: '3:00 PM', name: 'Service for Pregnant Women' },
      { time: '6:00 PM', name: 'Devotional Service' },
    ],
  },
  {
    day: 'Saturday',
    services: [
      { time: '4:00 PM', name: 'Church and Environment Cleaning Exercise' },
      { time: '4:00 PM', name: 'Choir Rehearsal' },
    ],
  },
  {
    day: 'Sunday',
    services: [{ time: '10:00 AM', name: 'Sunday Worship Service' }],
  },
];

const upcomingEvents = [
  {
    title: 'Celestial Church of Christ Worldwide Anniversary',
    date: 'September 29, 2026',
    icon: '🎉',
    description:
      "Join us as we celebrate another year of God's faithfulness, growth, and divine grace upon the Celestial Church of Christ worldwide.",
  },
  {
    title: 'Adult Harvest Thanksgiving Service',
    date: 'December 13, 2026',
    icon: '🌾',
    description:
      'A special thanksgiving service dedicated to giving glory and honor to God for His abundant blessings, provision, protection, and mercy throughout the year.',
  },
];

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* ── Page Header ── */}
      <section className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 py-20 text-center">
        <h1 className="font-serif text-4xl font-bold text-[#F5C518] md:text-5xl">
          Events & Service Schedule
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
          Join us in worship and fellowship. Here is our weekly service schedule
          and upcoming events.
        </p>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-20 space-y-20">
        {/* ── Weekly Service Schedule ── */}
        <section>
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-bold text-blue-950 md:text-4xl">
              Weekly Service Schedule
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-[#F5C518]" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {weeklySchedule.map((day) => (
              <div
                key={day.day}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition-shadow hover:shadow-xl"
              >
                {/* Day Header */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4">
                  <h3 className="text-xl font-bold text-[#F5C518]">
                    {day.day}
                  </h3>
                </div>

                {/* Services */}
                <div className="p-6 space-y-4">
                  {day.services.map((service, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                    >
                      <span className="mt-0.5 shrink-0 text-lg">🕐</span>
                      <div>
                        <p className="text-sm font-semibold text-[#D4A017]">
                          {service.time}
                        </p>
                        <p className="font-medium text-gray-800">
                          {service.name}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Note */}
                  {day.note && (
                    <div className="mt-3 rounded-lg border border-[#F5C518]/30 bg-[#F5C518]/10 px-4 py-3">
                      <p className="text-sm italic text-blue-900">
                        📌 {day.note}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Upcoming Events ── */}
        <section>
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-bold text-blue-950 md:text-4xl">
              Upcoming Events
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-[#F5C518]" />
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {upcomingEvents.map((event, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition-shadow hover:shadow-xl"
              >
                {/* Gold accent bar */}
                <div className="h-2 bg-gradient-to-r from-[#F5C518] to-[#D4A017]" />

                <div className="p-8">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-3xl">{event.icon}</span>
                    <p className="text-sm font-semibold text-[#D4A017]">
                      📅 {event.date}
                    </p>
                  </div>

                  <h3 className="mb-3 text-xl font-bold text-blue-950">
                    {event.title}
                  </h3>

                  <p className="leading-relaxed text-gray-600">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Invitation Banner ── */}
        <section className="rounded-2xl bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 p-8 text-center md:p-12">
          <p className="mb-4 text-4xl">🙏</p>
          <h2 className="font-serif text-2xl font-bold text-[#F5C518] md:text-3xl">
            Come and Worship With Us
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-white/80">
            &ldquo;Come and worship with us as we celebrate God&apos;s goodness
            and faithfulness.&rdquo;
          </p>
        </section>
      </div>
    </main>
  );
}