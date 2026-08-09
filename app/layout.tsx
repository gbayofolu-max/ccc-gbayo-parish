import "./globals.css";
import type { ReactNode } from "react";
import NavLink from "@/components/NavLink";
import Link from "next/link";
import Footer from "@/components/Footer";
import MobileMenu from "@/components/MobileMenu";
import NehemiahChatGate from "@/components/NehemiahChatGate";

export const metadata = {
  title: "CCC Gbayo Parish – Celestial Church of Christ, Ikorodu",
  description: "Celestial Church of Christ Gbayo Parish, Ikorodu. A spirit-filled church where everybody is somebody and Jesus reigns supreme.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-white flex flex-col min-h-screen">
        
        <nav className="sticky top-0 z-50 bg-gradient-to-r from-[#0A1628] via-[#132238] to-[#0A1628] border-b border-[#d4af37]/30 shadow-2xl">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="flex items-center justify-between h-16">

              <Link href="/" className="flex items-center shrink-0" aria-label="CCC Gbayo Parish Home">
                <img
                  src="/angel-icon.png?v=5"
                  alt="Angel"
                  width={40}
                  height={60}
                  className="object-contain block"
                  style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }}
                />
              </Link>

              <div className="hidden lg:flex items-center gap-6 xl:gap-8">
                <NavLink href="/">Home</NavLink>
                <NavLink href="/history">History</NavLink>
                <NavLink href="/events">Events</NavLink>
                <NavLink href="/announcements">Announcements</NavLink>
                <NavLink href="/mother-celestial">Mother Celestial</NavLink>
                <NavLink href="/contact">Contact</NavLink>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className="hidden sm:inline font-serif text-base md:text-lg font-bold text-[#d4af37] tracking-wide whitespace-nowrap"
                  style={{
                    textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 4px 8px rgba(0,0,0,0.7)',
                  }}
                >
                  CCC Gbayo Parish
                </span>
                <img
                  src="/logo.png"
                  alt="CCC Gbayo Parish"
                  width={48}
                  height={48}
                  className="object-contain hidden md:block"
                />
                <MobileMenu />
              </div>

            </div>
          </div>
        </nav>

        <main className="flex-grow">{children}</main>
        <Footer />
        <NehemiahChatGate />
      </body>
    </html>
  );
}