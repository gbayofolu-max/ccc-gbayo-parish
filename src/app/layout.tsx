import "./globals.css";
import type { ReactNode } from "react";
import NavLink from "@/components/NavLink";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";
import MobileMenu from "@/components/MobileMenu"; 
import CeleChat from "@/components/CeleChat";

export const metadata = {
  title: "CCC Gbayo Parish – Celestial Church of Christ, Ikorodu",
  description: "Celestial Church of Christ Gbayo Parish, Ikorodu. A spirit-filled church where everybody is somebody and Jesus reigns supreme.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-white">
        <nav className="sticky top-0 z-50 bg-gradient-to-r from-navy via-navy-mid to-navy border-b border-gold/30 backdrop-blur-sm shadow-lg">
          <div className="mx-auto max-w-7xl px-6 py-3">
            <div className="flex items-center justify-between">
              
              {/* HAMBURGER ON THE LEFT */}
              <div className="lg:hidden flex-shrink-0">
                <MobileMenu />
              </div>

              {/* LOGO - REDUCED SIZE */}
              <Link href="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gold/50 rounded">
                <Image
                  src="/logo.png"
                  alt="CCC Gbayo Parish logo"
                  width={50} 
                  height={50} 
                  className="rounded-full shadow-md ring-1 ring-gold/30 object-cover"
                  priority
                />
                <span className="font-serif text-lg md:text-xl font-bold text-gold drop-shadow-sm">
                  CCC Gbayo Parish
                </span>
              </Link>

              {/* DESKTOP NAV */}
              <div className="hidden lg:flex items-center gap-6 md:gap-8">
                <NavLink href="/">Home</NavLink>
                <NavLink href="/history">History</NavLink>
                <NavLink href="/events">Events</NavLink>
                <NavLink href="/announcements">Announcements</NavLink>
                <NavLink href="/mother-celestial">Mother Celestial</NavLink>
                <NavLink href="/contact">Contact</NavLink>
              </div>
            </div>
          </div>
        </nav>

        <main>{children}</main>
        
        <Footer />
        
        {/* Cele Chatbot - The component handles its own bottom-right positioning */}
        <CeleChat />
      </body>
    </html>
  );
}