'use client';

import React, { useState } from 'react';
import { useNehemiahChat } from './useNehemiahChat';
import { ChatMessageList } from './ChatMessages';

const STARTER_PROMPTS = [
  'What is in Hymn 5?',
  'What does John 3:16 mean?',
  'I need encouragement today',
  'Tell me about the parish history',
];

export default function NehemiahFullChat() {
  const [message, setMessage] = useState('');
  const { messages, loading, sendMessage, isFresh } = useNehemiahChat();

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || loading) return;
    const question = message;
    setMessage('');
    await sendMessage(question);
  }

  async function handleStarterClick(prompt: string) {
    if (loading) return;
    await sendMessage(prompt);
  }

  return (
    <div className="bg-[#FDF8F0] rounded-3xl shadow-2xl border border-gold/20 overflow-hidden flex flex-col h-[75vh] min-h-[500px]">
      <div className="relative bg-gradient-to-r from-navy to-navy-mid px-6 py-5 flex items-center gap-4 border-b border-gold/20 shrink-0">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div className="relative">
          <img src="/angel-icon.png" alt="Nehemiah" className="w-[44px] h-[62px] object-contain opacity-90" />
          <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-navy" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#FDF8F0] tracking-wide">Nehemiah AI</h2>
          <p className="text-[11px] text-gold/80 font-medium tracking-[0.15em] uppercase">Digital Ministry Companion — Online</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#F5F0E8] to-[#FDF8F0] p-5 md:p-6 space-y-1">
        <ChatMessageList messages={messages} loading={loading} />

        {isFresh && !loading && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-widest text-[#8B7E66] font-bold mb-3 text-center">Try asking</p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleStarterClick(prompt)}
                  className="text-sm px-4 py-2 rounded-full bg-white border border-gold/30 text-navy hover:bg-gold/10 hover:border-gold/50 transition-all shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="relative bg-white border-t border-[#e8e0d0] px-5 py-4 flex gap-3 shrink-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask Nehemiah anything..."
          disabled={loading}
          className="flex-1 bg-[#F5F0E8] rounded-xl border border-[#e8e0d0] px-4 py-3 text-[15px] text-[#3d3425] placeholder:text-[#8B7E66]/60 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="rounded-xl bg-gradient-to-r from-navy to-navy-mid px-6 py-3 font-bold text-gold text-sm tracking-wide hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 border border-gold/20"
        >
          Send
        </button>
      </form>
    </div>
  );
}