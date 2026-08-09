'use client';

import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useNehemiahChat } from './nehemiah/useNehemiahChat';
import { ChatMessageList } from './nehemiah/ChatMessages';

export default function NehemiahChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const { messages, loading, sendMessage } = useNehemiahChat();

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || loading) return;
    const question = message;
    setMessage('');
    await sendMessage(question);
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="fixed bottom-8 right-8 z-[9999] group" aria-label="Open Nehemiah AI">
        <div className="absolute inset-0 rounded-full bg-[#d4af37]/0 group-hover:bg-[#d4af37]/15 blur-2xl transition-all duration-700 scale-150" />
        <img src="/angel-icon.png" alt="Nehemiah AI" className="relative w-[50px] h-[70px] object-contain transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1" />
        <span className="absolute inset-0 rounded-full border border-[#d4af37]/0 group-hover:border-[#d4af37]/30 transition-all duration-500 scale-125" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9997] transition-opacity duration-500" style={{ backgroundColor: 'rgba(10, 22, 40, 0.55)' }} onClick={() => setIsOpen(false)} />

          <div ref={panelRef} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9998] w-[92vw] md:w-[85vw] lg:w-[800px] xl:w-[900px] h-[85vh] md:h-[80vh] bg-[#FDF8F0] rounded-3xl shadow-2xl border border-[#d4af37]/20 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
            <div className="relative bg-gradient-to-r from-[#0A1628] to-[#132238] px-6 py-4 flex justify-between items-center border-b border-[#d4af37]/20 shrink-0">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src="/angel-icon.png" alt="Nehemiah" className="w-[40px] h-[56px] object-contain opacity-90" />
                  <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#4ade80] rounded-full border-2 border-[#0A1628]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#FDF8F0] tracking-wide">Nehemiah AI</h2>
                  <p className="text-[11px] text-[#d4af37]/80 font-medium tracking-[0.15em] uppercase">Digital Ministry Companion</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-full text-[#FDF8F0]/70 hover:text-[#FDF8F0] hover:bg-white/10 transition-all duration-200">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#F5F0E8] to-[#FDF8F0] p-5 md:p-6 space-y-1">
              <ChatMessageList messages={messages} loading={loading} />
            </div>

            <form onSubmit={handleSend} className="relative bg-white border-t border-[#e8e0d0] px-5 py-4 flex gap-3 shrink-0">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent" />
              <input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask Nehemiah anything..."
                disabled={loading}
                className="flex-1 bg-[#F5F0E8] rounded-xl border border-[#e8e0d0] px-4 py-3 text-[15px] text-[#3d3425] placeholder:text-[#8B7E66]/60 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 focus:border-[#d4af37]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              />
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="rounded-xl bg-gradient-to-r from-[#0A1628] to-[#132238] px-6 py-3 font-bold text-[#d4af37] text-sm tracking-wide hover:shadow-lg hover:shadow-[#0A1628]/20 hover:from-[#132238] hover:to-[#1a2e4a] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all duration-300 border border-[#d4af37]/20"
              >
                Send
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}