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

  useEffect(() => {
    const prayer = getTodayPrayer();
    if (prayer) {
      setResponse(`✨ Daily Grace: ${prayer}`);
    } else {
      setResponse("Peace be with you! I am Cele, your spiritual companion. I can guide you through our history, sermons, bible lessons, and parish announcements. What would you like to discover today?");
    }
  }, []);

  const handleSend = () => {
    if (!message.trim()) return;

    const query = message.toLowerCase();
    setLoading(true);
    setResponse(null);

    setTimeout(() => {
      setLoading(false);

      if (query.includes('bible') || query.includes('scripture') || query.includes('verse') || query.includes('word of god')) {
        setResponse("The Word is a lamp to our feet! You can find daily inspiration on our Home page or visit our Bible Lesson section for deeper study: 📖 /lessons");
      }
      else if (query.includes('history') || query.includes('heritage') || query.includes('past') || query.includes('founding') || query.includes('legacy')) {
        setResponse("Our heritage is a testament to God's grace. Explore the journey and legacy of CCC Gbayo Parish here: 📜 /history");
      }
      else if (query.includes('announcement') || query.includes('news') || query.includes('update') || query.includes('constitution') || query.includes('rules')) {
        setResponse("Stay informed! All official news and the CCC Constitution are available here: 📄 /announcements");
      }
      else if (query.includes('sermon') || query.includes('slide') || query.includes('teaching') || query.includes('preach')) {
        setResponse("Divine wisdom is available! Watch our sermons at 📺 /sermons or download the Sermon Slides (PDFs) to follow along: 📖 /sermons/Slides");
      }
      else if (query.includes('lesson') || query.includes('study') || query.includes('doctrine') || query.includes('learn')) {
        setResponse("Grow in faith through our structured Bible Lessons and doctrinal studies: 🎓 /lessons");
      }
      else if (query.includes('mother') || query.includes('gbayo') || query.includes('celestial') || query.includes('portrait')) {
        setResponse("Honor the legacy of our Mother in Christ. View her biography and teachings here: 🖼️ /mother-celestial");
      }
      else if (query.includes('live') || query.includes('prayer') || query.includes('moment') || query.includes('event') || query.includes('calendar') || query.includes('schedule')) {
        setResponse("Join us in fellowship! 🎙️ Live Prayer: /live | 📅 Church Calendar: /events");
      }
      else if (query.includes('contact') || query.includes('address') || query.includes('phone') || query.includes('email') || query.includes('where')) {
        setResponse("We would love to welcome you! 📍 Find us in Ikorodu, Lagos. Visit /contact for full details and directions.");
      }
      else if (query.includes('hymn') || query.includes('singing') || query.includes('song')) {
        setResponse("Our hymns lift our spirits! You can find the hymnal and meanings in the Lessons section: 🎶 /lessons/hymns");
      }
      else if (query.includes('help') || query.includes('guide') || query.includes('who are you') || query.includes('what can you do')) {
        setResponse("I am Cele, your digital guide. I can help you find: \n• 📖 Bible & Lessons\n• 📜 History & Heritage\n• 📺 Sermons & Slides\n• 📄 Announcements\n• 🎙️ Live Prayer\nJust ask me about any of these!");
      }
      else {
        setResponse("I am still learning the depths of our parish. Try asking about 'History', 'Sermons', 'Bible Lessons', or 'Announcements'.");
      }
    }, 600);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-navy hover:bg-navy-mid text-gold p-4 rounded-full shadow-2xl transition-all hover:scale-110 focus:outline-none ring-2 ring-gold/50"
        aria-label="Chat with Cele"
      >
        <div className="relative">
          <ChatBubbleLeftRightIcon className="h-8 w-8" />
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-gold"></span>
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-gold/30 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gradient-to-r from-navy to-navy-mid p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gold flex items-center justify-center shadow-inner">
            <SparklesIcon className="h-6 w-6 text-navy" />
          </div>
          <div>
            <h3 className="text-white font-serif font-bold text-lg">Cele</h3>
            <p className="text-gold text-xs italic">Spiritual Companion</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20 p-1 rounded-full transition-colors"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto p-4 bg-slate-50">
        {response && (
          <div className="mb-4 text-sm text-navy bg-white p-4 rounded-2xl border-l-4 border-gold shadow-sm italic whitespace-pre-line">
            {response}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-2">
          {['Sermons', 'History', 'Bible', 'Lessons', 'Events'].map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setMessage(chip);
                handleSend();
              }}
              className="px-3 py-1 text-xs font-medium bg-white text-navy border border-gold/30 rounded-full hover:bg-gold/20 transition shadow-sm"
            >
              {chip}
            </button>
          ))}
          <Link
            href="/live"
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gold text-navy border border-gold rounded-full hover:bg-gold/80 transition shadow-sm"
          >
            <HeartIcon className="h-3 w-3 mr-1" /> Moments of Prayer
          </Link>
        </div>
      </div>

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
            placeholder="Ask Cele something..."
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!message.trim() || loading}
            className="p-2 bg-navy text-gold rounded-xl hover:bg-navy-mid disabled:opacity-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
        <p className="mt-2 text-[10px] text-gray-400 text-center">
          Cele is a sacred guide based on Parish rules.
        </p>
      </div>
    </div>
  );
};

export default CeleChat;