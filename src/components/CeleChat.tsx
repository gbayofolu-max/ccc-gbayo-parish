// src/components/CeleChat.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChatBubbleLeftRightIcon, XMarkIcon, SparklesIcon, HeartIcon } from '@heroicons/react/24/outline';
import { getTodayPrayer } from '@/data/prayers';

const CeleChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Show daily prayer prompt on mount — once per session
  useEffect(() => {
    setResponse(getTodayPrayer());
  }, []);

  const handleSend = () => {
    if (!message.trim()) return;

    const query = message.toLowerCase();
    setLoading(true);
    setResponse(null);

    // Simulate "thinking"
    setTimeout(() => {
      setLoading(false);

      // ✅ RULE-BASED INTENTS
      if (query.includes('bible') || query.includes('scripture') || query.includes('verse')) {
        setResponse(
          "I’d love to share a verse! Tap here for today’s verse: " +
          "👉 /verse-of-the-day (placeholder — connect to /api/verse later)"
        );
      }
      else if (query.includes('hymn') || query.includes('hymns')) {
        setResponse(
          "CCC Gbayo treasures our rich hymns! View our hymnal and learn the meanings: " +
          "🔗 /lessons/hymns"
        );
      }
      else if (query.includes('lesson') || query.includes('lessons')) {
        setResponse(
          "Bible lessons are available in our Lessons section: " +
          "🔗 /lessons — including Sermon Slides, Bible Studies, and Doctrine."
        );
      }
      else if (query.includes('calendar') || query.includes('events') || query.includes('schedule')) {
        setResponse(
          "Stay updated: " +
          "📅 Church Calendar → /events " +
          "📅 Prayer Meetings → /live (Moments of Prayer)"
        );
      }
      else if (query.includes('live') || query.includes('prayer') || query.includes('prayer moment')) {
        setResponse(
          "Join our Moments of Prayer live: " +
          "🎙️ /live " +
          "(Join our daily prayer stream + prayer requests box)"
        );
      }
      else if (query.includes('sermon') || query.includes('sermons')) {
        setResponse(
          "Watch & listen to sermons: " +
          "📺 /sermons " +
          "📖 Sermon Slides (PDF) in /sermons/Slides"
        );
      }
      else if (query.includes('constitution') || query.includes('ccc constitution')) {
        setResponse(
          "Download our official CCC Constitution: " +
          "📄 /announcements (look for 'constitution.pdf')"
        );
      }
      else if (query.includes('mother') || query.includes('gbayo') || query.includes('celestial')) {
        setResponse(
          "Honor our Mother in Christ: " +
          "🖼️ /mother-celestial " +
          "📜 Her legacy, quotes, and impact on our parish."
        );
      }
      else if (query.includes('contact') || query.includes('address') || query.includes('email') || query.includes('phone')) {
        setResponse(
          "Reach us: " +
          "📍 Ikorodu, Lagos " +
          "📞 080-XXX-XXXX " +
          "✉️ cccgbayo@example.com (placeholder)"
        );
      }
      else if (query.includes('history') || query.includes('past')) {
        setResponse(
          "Discover our journey: " +
          "📜 /history — From founding to today."
        );
      }
      else if (query.includes('help') || query.includes('guide') || query.includes('who are you')) {
        setResponse(
          "I’m Cele — your digital companion! I help you: " +
          "• Find sermons & lessons " +
          "• Join prayer moments " +
          "• Read the Bible " +
          "• Connect with church life 🌟"
        );
      }
      else {
        setResponse(
          "I’m still learning! Try asking about: " +
          "‘sermons’, ‘hymns’, ‘prayer’, ‘mother’, ‘events’, or ‘contact’."
        );
      }
    }, 600);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-2xl animate-bounce-slow transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-emerald-300"
        aria-label="Chat with Cele"
      >
        <ChatBubbleLeftRightIcon className="h-8 w-8" />
        <span className="absolute top-0 right-0 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-medium">Cele</h3>
            <p className="text-emerald-200 text-xs">Spiritual Companion</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-emerald-800 p-1 rounded focus:outline-none"
          aria-label="Close chat"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[60vh] overflow-y-auto p-4 bg-gray-50">
        {/* Daily Prayer Prompt (always shown first) */}
        {response && (
          <div className="mb-4 text-sm text-gray-700 bg-white p-3 rounded-xl border-l-4 border-emerald-500 shadow-sm">
            {response}
          </div>
        )}

        {/* Suggested Buttons */}
        <div className="flex flex-wrap gap-2 mt-2">
          {['sermons', 'prayer', 'hymns', 'mother', 'events'].map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setMessage(chip);
                // don’t duplicate — just call handleSend directly
                handleSend();
              }}
              className="px-3 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full hover:bg-emerald-100 transition"
            >
              {chip}
            </button>
          ))}
          {/* Prayer link — special button */}
          <Link
            href="/live"
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center px-3 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full hover:bg-amber-100"
          >
            <HeartIcon className="h-3 w-3 mr-1" /> Moments of Prayer
          </Link>
        </div>
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask Cele..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!message.trim() || loading}
            className="p-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
        <p className="mt-2 text-[10px] text-gray-400 text-center">
          Cele uses rules — not AI. No data stored.
        </p>
      </div>
    </div>
  );
};

export default CeleChat;