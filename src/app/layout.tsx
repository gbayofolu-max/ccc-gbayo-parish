import "./globals.css";
import type { ReactNode } from "react";
import NavLink from "@/components/NavLink";
import Image from "next/image";
import Link from "next/link";                     // <‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑
import Footer from "@/components/Footer";

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
      <body className="font-sans antialiased">
        {/* ----------------------------------------------------------- */}
        {/*  Sticky Header – logo + navigation, glass‑blur effect       */}
        {/* ----------------------------------------------------------- */}
        <nav className="sticky top-0 z-50 bg-gradient-to-r from-navy via-navy-mid to-navy border-b border-navy/30 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            {/* ---- LOGO + BRAND TEXT ---- */}
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="CCC Gbayo Parish logo"
                width={70}
                height={70}
                className="rounded-full shadow-2xl ring-2 ring-gold/30"
                priority
              />
              <span className="font-serif text-2xl font-bold text-gold drop-shadow-[0_2px_2px_rgba(0,0,0,0.7)]">
                CCC Gbayo Parish
              </span>
            </Link>

            {/* ---- NAVIGATION LINKS ---- */}
            <div className="flex items-center gap-8 lg:gap-12">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/history">History</NavLink>
              <NavLink href="/events">Events</NavLink>
              <NavLink href="/contact">Contact</NavLink>
            </div>
          </div>
        </nav>

        {/* ----------------------------------------------------------- */}
        {/*  Main page content                                         */}
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