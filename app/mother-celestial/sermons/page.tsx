import React from 'react';

export default function MotherSermonsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-6">
      <div className="max-w-5xl mx-auto text-center">
        {/* Header Section */}
        <h1 className="font-serif text-4xl md:text-5xl text-navy font-bold mb-4">
          Sacred Teachings
        </h1>
        <p className="text-gray-600 text-lg italic mb-12 max-w-2xl mx-auto">
          "Exploring the spiritual legacy and divine wisdom shared by our Mother Celestial to guide the flock toward holiness."
        </p>

        {/* Content Placeholder */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-16 border border-gold/20">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="p-4 bg-gold/10 rounded-full">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-12 w-12 text-gold" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif text-navy font-semibold">Sermon Archive</h2>
            <p className="text-gray-500 max-w-md">
              We are currently organizing the audio and text records of these divine messages. 
              Please check back soon or visit the Announcements page for current updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}