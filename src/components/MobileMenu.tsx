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
  { name: 'Sermons (Mother)', href: '/mother-celestial/sermons' },
  { name: 'Lessons', href: '/lessons' },
  { name: 'Contact', href: '/contact' },
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  return (
    <>
      {/* THE HAMBURGER BUTTON - Adjusted padding to not be at extreme corner */}
      <button
        className="ml-2 p-2 rounded-md text-gold hover:bg-gold/10 focus:outline-none transition-colors"
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
      >
        <Bars3Icon className="h-8 w-8" />
      </button>

      {/* BACKDROP OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SLIDE-OUT SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header - Updated to CCC GBAYO and gold border */}
        <div className="flex items-center justify-between p-6 border-b border-gold/20">
          <h2 className="text-xl font-serif font-bold text-navy">CCC GBAYO</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-gold/10 hover:text-navy rounded-lg transition-all font-medium"
            >
              {link.name}
            </Link>
          ))}
        </nav>
        
        {/* Footer section removed as requested */}
      </aside>
    </>
  );
}