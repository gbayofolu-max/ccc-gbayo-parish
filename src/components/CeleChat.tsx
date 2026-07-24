'use client';

import React, { useState, useEffect, useRef } from 'react'; // Fixed: changed 'eact' to 'react'
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getTodayPrayer } from '@/data/prayers';

export default function CeleChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Load Daily Grace on Mount
  useEffect(() => {
    const prayer = getTodayPrayer();
    setResponse(prayer ? `Daily Grace: ${prayer}` : 'Peace be with you! I am Cele, your spiritual companion.');
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    const input = message;
    setMessage(''); 
    
    try {
      const res = await fetch('/api/cele/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input })
      });
      const data = await res.json();
      
      if (data && data.answer) {
        setResponse(data.answer);
      } else {
        setResponse("I am reflecting on that. Could you rephrase your question, beloved?");
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setResponse("Let's seek understanding together. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen && 
        chatRef.current && 
        !chatRef.current.contains(event.target as Node)
      ) {
        // Only close if we didn't click the trigger button
        const target = event.target as HTMLElement;
        if (!target.closest('.cele-trigger')) {
            setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside); // Fixed: case sensitivity
  }, [isOpen]);

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="cele-trigger fixed bottom-8 right-8 z-[10000] hover:scale-110 transition-all flex items-center justify-center p-0 bg-transparent border-none focus:outline-none"
      >
        <img 
          src="/angel-icon.png" 
          alt="Cele" 
          className="w-[45px] h-[70px] object-contain drop-shadow-xl"
          onError={(e) => { 
            const target = e.target as HTMLImageElement;
            target.outerHTML = '<span style="font-size:40px;">👼</span>'; 
          }}
        />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div 
          ref={chatRef}
          className="fixed bottom-28 right-8 z-[9999] w-80 h-[500px] bg-white rounded-2xl shadow-2xl border-4 border-[#000080] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          {/* Header */}
          <div className="bg-[#000080] p-4 flex justify-between items-center text-[#FFD700]">
            <div className="flex items-center gap-3">
              <span className="text-xl">👼</span>
              <span className="font-bold text-sm tracking-wide">Cele - Companion</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform text-[#FFD700]">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow overflow-y-auto p-4 bg-slate-50 text-[#000080] text-sm">
             {loading ? (
               <div className="flex flex-col items-center justify-center h-full opacity-50">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#000080] mb-2"></div>
                 <p className="italic">Cele is reflecting...</p>
               </div>
             ) : (
               <div className="whitespace-pre-wrap italic leading-relaxed">
                 {response || "How can I help you today, beloved?"}
               </div>
             )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 border-t bg-white flex gap-2">
            <input 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              className="flex-1 p-2 border rounded text-[#000080] text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]" 
              placeholder="Ask Cele..." 
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={loading || !message.trim()}
              className="bg-[#000080] text-[#FFD700] px-4 py-1 rounded font-bold disabled:opacity-50 transition-colors hover:bg-blue-900"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}