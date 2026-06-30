export const metadata = {
  title: 'Contact Us – CCC Gbayo Parish',
  description:
    'Get in touch with Celestial Church of Christ Gbayo Parish, Ikorodu.',
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* ── Page Header ── */}
      <section className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 py-20 text-center">
        <h1 className="font-serif text-4xl font-bold text-[#F5C518] md:text-5xl">
          Contact Us
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
          We would love to hear from you. Reach out to us through any of the
          channels below.
        </p>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-20 space-y-16">
        {/* ── Contact Cards ── */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* Address */}
          <div className="rounded-2xl border-t-4 border-[#F5C518] bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5C518]/10">
              <svg
                className="h-7 w-7 text-[#F5C518]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-blue-950">Our Address</h3>
            <p className="leading-relaxed text-gray-600">
              No. 13/15 Philip Erara Street
              <br />
              Igboluwo Estate, Jumofak Bus Stop
              <br />
              Ikorodu, Lagos State, Nigeria
            </p>
          </div>

          {/* Phone */}
          <div className="rounded-2xl border-t-4 border-[#F5C518] bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5C518]/10">
              <svg
                className="h-7 w-7 text-[#F5C518]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-blue-950">Phone</h3>
            <p className="leading-relaxed text-gray-600">
              +234 803 569 7667
              <br />
              <span className="text-sm text-gray-400">WhatsApp available</span>
            </p>
          </div>

          {/* Email */}
          <div className="rounded-2xl border-t-4 border-[#F5C518] bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5C518]/10">
              <svg
                className="h-7 w-7 text-[#F5C518]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-blue-950">Email</h3>
            <p className="leading-relaxed text-gray-600">
              info@cccgbayoparish.org
            </p>
          </div>
        </div>

        {/* ── Map Section ── */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-2xl font-bold text-blue-950">
              Find Us on the Map
            </h2>
            <p className="mt-1 text-gray-500">
              Click below to open directions in Google Maps
            </p>
          </div>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.550346850239!2d3.504222074697368!3d6.459039324021793!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103bf75d3153549d%3A0x6e768e14e1a7429d!2sCelestial%20Church%20of%20Christ%20Gbayo%20Parish!5e0!3m2!1sen!2sng!4v1725000000000!5m2!1sen!2sng"
              className="absolute inset-0 h-full w-full"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="CCC Gbayo Parish Location"
            />
          </div>
          <div className="bg-gray-50 p-4 text-center">
            <a
              href="https://maps.app.goo.gl/nqiiJ2NDoq89NRx28"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#F5C518] px-6 py-3 font-semibold text-blue-950 transition-colors hover:bg-[#D4A017]"
            >
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
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Open in Google Maps
            </a>
          </div>
        </div>

        {/* ── Facebook Links ── */}
        <div className="rounded-2xl bg-white p-8 text-center shadow-lg md:p-12">
          <h2 className="font-serif text-2xl font-bold text-blue-950 md:text-3xl">
            Connect With Us on Facebook
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-gray-500">
            Follow our pages for updates, sermons, announcements, and
            inspirational content.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://www.facebook.com/profile.php?id=100082143999349"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full bg-[#1877F2] px-8 py-4 font-semibold text-white shadow-md transition-colors hover:bg-[#166FE5]"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Parish Facebook Page
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=100006017388304"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full bg-[#1877F2] px-8 py-4 font-semibold text-white shadow-md transition-colors hover:bg-[#166FE5]"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Pastor&apos;s Facebook Page
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}