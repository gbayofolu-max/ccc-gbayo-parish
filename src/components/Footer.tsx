'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-blue-800/50 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          {/* Copyright */}
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} CCC Gbayo Parish. All rights reserved.
          </p>

          {/* Quick Nav Links */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-sm text-gray-400 transition-colors hover:text-[#F5C518]"
            >
              Home
            </Link>
            <Link
              href="/history"
              className="text-sm text-gray-400 transition-colors hover:text-[#F5C518]"
            >
              History
            </Link>
            <Link
              href="/events"
              className="text-sm text-gray-400 transition-colors hover:text-[#F5C518]"
            >
              Events
            </Link>
            <Link
              href="/contact"
              className="text-sm text-gray-400 transition-colors hover:text-[#F5C518]"
            >
              Contact
            </Link>
          </div>
        </div>

        {/* Motto */}
        <div className="mt-6 border-t border-blue-800/50 pt-6 text-center">
          <p className="font-serif text-sm italic text-[#F5C518]">
            &ldquo;And ye shall know the truth, and the truth shall make you
            free.&rdquo; — John 8:32
          </p>
        </div>
      </div>
    </footer>
  );
}