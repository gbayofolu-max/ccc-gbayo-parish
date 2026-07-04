// src/app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";
import NavLink from "@/components/NavLink";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";

// Optional: Mobile menu component — import if/when built
// import MobileMenu from "@/components/MobileMenu";

export const metadata = {
  title: "CCC Gbayo Parish – Celestial Church of Christ, Ikorodu",
  description:
    "Celestial Church of Christ Gbayo Parish, Ikorodu. A spirit-filled church where everybody is somebody and Jesus reigns supreme.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-white">
        {/* ----------------------------------------------------------- */}
        {/*  STICKY HEADER – Logo + Nav (Desktop) + Hamburger Placeholder */}
        {/* ----------------------------------------------------------- */}
        <nav className="sticky top-0 z-50 bg-gradient-to-r from-navy via-navy-mid to-navy border-b border-navy/30 backdrop-blur-sm shadow-lg">
          <div className="mx-auto max-w-7xl px-6 py-3">
            {/* Top Row: Logo + Mobile Trigger */}
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-gold/50 rounded">
                <Image
                  src="/logo.png"
                  alt="CCC Gbayo Parish logo"
                  width={64}
                  height={64}
                  className="rounded-full shadow-2xl ring-2 ring-gold/20 object-cover"
                  priority
                />
                <span className="font-serif text-2xl md:text-3xl font-bold text-gold drop-shadow-[0_2px_2px_rgba(0,0,0,0.7)]">
                  CCC Gbayo Parish
                </span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden lg:flex items-center gap-8 md:gap-10">
                <NavLink href="/">Home</NavLink>
                <NavLink href="/history">History</NavLink>
                <NavLink href="/events">Events</NavLink>
                <NavLink href="/contact">Contact</NavLink>
                <NavLink href="/announcements">Announcements</NavLink>
                <NavLink href="/mother-celestial">Mother Celestial</NavLink>
              </div>

              {/* Mobile Menu Button (future: MobileMenu component) */}
              <div className="lg:hidden">
                <button
                  className="text-gold hover:text-gold/80 focus:outline-none"
                  aria-label="Open navigation menu"
                  onClick={() => { /* TODO: open mobile menu */ }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-8 w-8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* ----------------------------------------------------------- */}
        {/*  Main Page Content                                         */}
        {/* ----------------------------------------------------------- */}
        <main>{children}</main>

        {/* ----------------------------------------------------------- */}
        {/*  Footer                                                   */}
        {/* ----------------------------------------------------------- */}
        <Footer />
      </body>
    </html>
  );
}