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
      className="relative w-full overflow-hidden bg-linear-to-br from-navy via-navy-mid to-navy py-24"
    >
      {/* Soft glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-navy-light/20 rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-6">
        
        {/* Section Header */}
        <div
          className={`text-center mb-16 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'
          }`}
        >
          <span className="inline-block text-gold text-sm font-semibold tracking-widest uppercase mb-4">
            Our Legacy
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
            Our Spiritual Heritage
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Honoring the foundations of our faith — from our Lord and Savior, to the founder of the Celestial Church of Christ, to the founder of our beloved parish.
          </p>
        </div>

        {/* 3-column grid — Jesus, Oshoffa, Rev. Gbayo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">

          <div
            className={`flex flex-col items-center text-center transform transition-all duration-1000 delay-100 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
            }`}
          >
            <div className="relative w-56 h-72 rounded-[50%] overflow-hidden border-4 border-navy-light shadow-2xl shadow-navy-light/30 mb-6">
              <Image
                src="/jesus.jpg"
                alt="Our Lord Jesus Christ"
                width={224}
                height={288}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-linear-to-t from-navy/40 via-transparent to-transparent" />
            </div>
            <h3 className="text-xl font-serif font-bold text-gold mb-2">
              Our Lord Jesus Christ
            </h3>
            <p className="text-gray-400 text-sm">
              Our Savior &amp; Foundation
            </p>
          </div>

          <div
            className={`flex flex-col items-center text-center transform transition-all duration-1000 delay-200 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
            }`}
          >
            <div className="relative w-56 h-72 rounded-[50%] overflow-hidden border-4 border-gold shadow-2xl shadow-gold/30 mb-6">
              <Image
                src="/oshoffa.jpg"
                alt="Papa S.B.J. Oshoffa"
                width={224}
                height={288}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-linear-to-t from-navy/40 via-transparent to-transparent" />
            </div>
            <h3 className="text-xl font-serif font-bold text-gold mb-2">
              Papa S.B.J. Oshoffa
            </h3>
            <p className="text-gray-400 text-sm">
              Founder CCC Worldwide
            </p>
          </div>

          <div
            className={`flex flex-col items-center text-center transform transition-all duration-1000 delay-300 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
            }`}
          >
            <div className="relative w-56 h-72 rounded-[50%] overflow-hidden border-4 border-gold shadow-2xl shadow-gold/30 mb-6">
              <Image
                src="/rev-gbayo.jpg"
                alt="Rev. Henry Moronfolu Gbayo"
                width={224}
                height={288}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-linear-to-t from-navy/40 via-transparent to-transparent" />
            </div>
            <h3 className="text-xl font-serif font-bold text-gold mb-2">
              Reverend H.M. Gbayo
            </h3>
            <p className="text-gray-400 text-sm">
              Founder C.C.C Gbayo Parish
            </p>
          </div>

        </div>

        {/* CTA */}
        <div
          className={`text-center mt-16 transform transition-all duration-1000 delay-500 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}
        >
          <Link
            href="/history"
            className="inline-flex items-center gap-3 rounded-lg bg-gold px-8 py-4 text-lg font-semibold text-gray-900 hover:bg-dark-gold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
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