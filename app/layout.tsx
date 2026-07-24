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
      <body className="font-sans antialiased bg-white flex flex-col min-h-screen">
        
        {/* REFINED HEADER - Added vertical padding (py-5) for a premium look */}
        <nav className="sticky top-0 z-50 bg-gradient-to-r from-navy via-navy-mid to-navy border-b border-gold/30 shadow-2xl">
          <div className="mx-auto max-w-7xl px-4 md:px-8 py-5">
            <div className="flex items-center justify-between">
              
              <div className="lg:hidden flex items-center">
                <MobileMenu />
              </div>

              {/* LOGO AREA - Top-Left (as requested) */}
              <Link href="/" className="flex items-center gap-4 hover:opacity-90 transition-opacity z-[60]">
                <Image
                  src="/logo.png"
                  alt="CCC Gbayo Parish logo"
                  width={70} 
                  height={70} 
                  className="rounded-full shadow-lg ring-2 ring-gold/50 object-contain bg-white"
                  priority
                />
                <span className="font-serif text-xl md:text-2xl font-bold text-gold tracking-wide whitespace-nowrap">
                  CCC Gbayo Parish
                </span>
              </Link>

              {/* DESKTOP NAV */}
              <div className="hidden lg:flex items-center gap-8">
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

        <main className="flex-grow">{children}</main>
        
        <Footer />
        
        {/* CeleChat is rendered here - verified in the component file below */}
        <CeleChat />
      </body>
    </html>
  );
}