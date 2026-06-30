'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function OurLegacy() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="history-preview"
      className="relative w-full overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 py-24"
    >
      {/* Soft glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-6">
        
        {/* Section Header */}
        <div
          className={`text-center mb-16 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'
          }`}
        >
          <span className="inline-block text-[#F5C518] text-sm font-semibold tracking-widest uppercase mb-4">
            Our Legacy
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
            Our Spiritual Heritage
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Honoring the foundations of our faith — from our Lord and Savior, to the founder of the Celestial Church of Christ, to the founder of our beloved parish.
          </p>
        </div>

        {/* ------------------------------------------------------ */}
        {/* 3‑COLUMN GRID – Jesus, Oshoffa, Rev. Gbayo            */}
        {/* ------------------------------------------------------ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">

          {/* ==================== BOX 1 – JESUS ==================== */}
          <div
            className={`flex flex-col items-center text-center transform transition-all duration-1000 delay-100 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
            }`}
          >
            {/* Oval Image Container */}
            <div className="relative w-56 h-72 rounded-[50%] overflow-hidden border-4 border-blue-500 shadow-2xl shadow-blue-500/30 mb-6">
              <Image
                src="/jesus.jpg"
                alt="Our Lord Jesus Christ"
                width={224}
                height={288}
                className="object-cover w-full h-full"
              />
              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/40 via-transparent to-transparent" />
            </div>
            {/* Name Label */}
            <h3 className="text-xl font-serif font-bold text-[#F5C518] mb-2">
              Our Lord Jesus Christ
            </h3>
            <p className="text-gray-400 text-sm">
              Our Savior & Foundation
            </p>
          </div>

          {/* ==================== BOX 2 – OSHOFFA ================== */}
          <div
            className={`flex flex-col items-center text-center transform transition-all duration-1000 delay-200 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
            }`}
          >
            {/* Oval Image Container */}
            <div className="relative w-56 h-72 rounded-[50%] overflow-hidden border-4 border-[#F5C518] shadow-2xl shadow-amber-500/30 mb-6">
              <Image
                src="/oshoffa.jpg"
                alt="Papa S.B.J. Oshoffa"
                width={224}
                height={288}
                className="object-cover w-full h-full"
              />
              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/40 via-transparent to-transparent" />
            </div>
            {/* Name Label */}
            <h3 className="text-xl font-serif font-bold text-[#F5C518] mb-2">
              Papa S.B.J. Oshoffa
            </h3>
            <p className="text-gray-400 text-sm">
              Founder CCC Worldwide
            </p>
          </div>

          {/* ==================== BOX 3 – REV. GBAYO =============== */}
          <div
            className={`flex flex-col items-center text-center transform transition-all duration-1000 delay-300 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
            }`}
          >
            {/* Oval Image Container */}
            <div className="relative w-56 h-72 rounded-[50%] overflow-hidden border-4 border-[#F5C518] shadow-2xl shadow-amber-500/30 mb-6">
              <Image
                src="/rev-gbayo.jpg"
                alt="Rev. Henry Moronfolu Gbayo"
                width={224}
                height={288}
                className="object-cover w-full h-full"
              />
              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/40 via-transparent to-transparent" />
            </div>
            {/* Name Label */}
            <h3 className="text-xl font-serif font-bold text-[#F5C518] mb-2">
              Reverend H.M. Gbayo
            </h3>
            <p className="text-gray-400 text-sm">
              Founder C.C.C Gbayo Parish
            </p>
          </div>

        </div>

        {/* ------------------------------------------------------ */}
        {/* CTA Button                                              */}
        {/* ------------------------------------------------------ */}
        <div
          className={`text-center mt-16 transform transition-all duration-1000 delay-500 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}
        >
          <Link
            href="/history"
            className="inline-flex items-center gap-3 rounded-lg bg-[#F5C518] px-8 py-4 text-lg font-semibold text-gray-900 hover:bg-[#D4A017] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Read Full History
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </Link>
        </div>

      </div>
    </section>
  );
}