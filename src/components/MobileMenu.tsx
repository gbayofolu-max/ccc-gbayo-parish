'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'History', href: '/history' },
  { name: 'Events', href: '/events' },
  { name: 'Announcements', href: '/announcements' },
  { name: 'Mother Celestial', href: '/mother-celestial' },
  { name: 'Sermons', href: '/mother-celestial/sermons' },
  { name: 'Lessons', href: '/lessons' },
  { name: 'Contact Us', href: '/contact' },
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  return (
    <>
      {/* VISIBLE HAMBURGER BUTTON */}
      <button
        className="ml-2 p-2 rounded-full bg-gold/20 text-gold hover:bg-gold hover:text-navy transition-all active:scale-90 focus:outline-none shadow-sm border border-gold/30"
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
      >
        <Bars3Icon className="h-7 w-7" />
      </button>

      {/* DARK OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-navy/80 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR MENU */}
      <aside
        className={`fixed top-0 left-0 z-[70] h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gold/20 bg-gradient-to-r from-navy to-navy-mid">
          <div className="flex flex-col">
            <h2 className="text-2xl font-serif font-bold text-gold">CCC GBAYO</h2>
            <span className="text-white/70 text-xs italic">Digital Sanctuary</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-4 px-4 space-y-1 overflow-y-auto h-[calc(100vh-100px)]">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 text-navy hover:bg-gold/20 hover:text-navy font-serif font-medium rounded-xl transition-all text-lg border-b border-gray-50"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-8 left-0 w-full px-6 text-center">
           <p className="text-[10px] text-gray-400 uppercase tracking-widest">© {new Date().getFullYear()} CCC Gbayo Parish</p>
        </div>
      </aside>
    </>
  );
}