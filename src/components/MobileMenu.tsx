// src/components/MobileMenu.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NavLink from './NavLink';
import { XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'History', href: '/history' },
  { name: 'Events', href: '/events' },
  { name: 'Contact', href: '/contact' },
  { name: 'Sermons', href: '/sermons' },
  { name: 'Announcements', href: '/announcements' },
  { name: 'Lessons', href: '/lessons' },
  { name: 'Live', href: '/live' },
  { name: 'Mother Celestial', href: '/mother-celestial' },
  { name: 'Sermons (Mother)', href: '/mother-celestial/sermons' },
];

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Prevent body scroll when menu open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* Hamburger Button */}
      <button
        className="lg:hidden relative z-50 p-2 rounded-md text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
      >
        <Bars3Icon className="h-8 w-8" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-emerald-100">
          <h2 className="text-xl font-serif font-bold text-emerald-900">CCC-GBAY</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Links */}
        <nav className="mt-6 px-4 space-y-1" role="navigation" aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg transition-colors duration-200 font-medium"
            >
              {link.name}
            </Link>
          ))}

          {/* Admin Link (conditional) */}
          {typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="px-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                Admin Portal
              </p>
              <Link
                href="/admin/sermons"
                onClick={() => setIsOpen(false)}
                className="mt-2 flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
              >
                Manage Sermons
              </Link>
            </div>
          )}
        </nav>

        {/* Footer in Sidebar */}
        <div className="absolute bottom-0 w-full p-6 border-t border-emerald-100 bg-emerald-50/50">
          <p className="text-center text-sm text-gray-500">
            “Your word is a lamp to my feet and a light to my path.”<br />
            <span className="font-serif italic text-gray-600">— Psalm 119:105</span>
          </p>
        </div>
      </aside>
    </>
  );
};

export default MobileMenu;