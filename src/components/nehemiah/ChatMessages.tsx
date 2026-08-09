'use client';

import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from './useNehemiahChat';

function WordCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0f2240] via-[#162b4d] to-[#1a3260] border border-[#d4af37]/30 shadow-lg transition-all duration-500 hover:shadow-xl hover:border-[#d4af37]/50">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#d4af37] via-[#f0d878] to-[#d4af37]" />
      <div className="absolute top-3 right-3 opacity-[0.08] pointer-events-none">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.2">
          <path d="M12 2v20M2 12h20" />
        </svg>
      </div>
      <div className="p-5 pl-6 font-serif text-[#f8f4e8] text-[15px] leading-[1.85] tracking-wide [&_strong]:text-[#d4af37] [&_strong]:font-bold [&_strong]:text-sm [&_strong]:tracking-wider [&_strong]:uppercase [&_p]:!text-[#f8f4e8] [&_p]:mb-2 [&_p:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}

function enrichScriptures(text: string): string {
  return text.replace(
    /^\s*\[((?:[1-3]\s*)?[A-Za-z]+(?:\s+[A-Za-z]+)*\s+\d+:\d+(?:-\d+)?(?:\s*,\s*\d+)?)\]\s*(.+)$/gm,
    '\n> **$1**\n> $2\n'
  );
}

function MarkdownComponents({ isUser }: { isUser: boolean }) {
  return {
    blockquote: ({ children }: any) => <WordCard>{children}</WordCard>,
    p: ({ children }: any) => (
      <p className={`mb-3 last:mb-0 leading-[1.75] ${isUser ? 'text-[#f8f4e8]/95' : 'text-[#3d3425]'}`}>{children}</p>
    ),
    h1: ({ children }: any) => (
      <h1 className="text-lg font-bold text-[#0A1628] mt-4 mb-2 pb-1 border-b border-[#d4af37]/30">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-base font-bold text-[#0A1628] mt-3 mb-2 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-sm font-bold text-[#5A4A2F] mt-3 mb-1 uppercase tracking-wider">{children}</h3>
    ),
    strong: ({ children }: any) => (
      <strong className={`font-semibold ${isUser ? 'text-[#f0d878]' : 'text-[#0A1628]'}`}>{children}</strong>
    ),
    em: ({ children }: any) => <em className="italic text-[#7a6a4f]">{children}</em>,
    ul: ({ children }: any) => <ul className="my-2 space-y-1.5 ml-1">{children}</ul>,
    ol: ({ children }: any) => (
      <ol className="my-2 space-y-1.5 ml-1 list-decimal list-inside marker:text-[#d4af37] marker:font-bold">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="flex items-start gap-2 text-[15px] leading-relaxed">
        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#d4af37]/70 flex-shrink-0" />
        <span>{children}</span>
      </li>
    ),
    hr: () => (
      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#d4af37]/30" />
        <span className="text-[#d4af37]/50 text-xs">✦</span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#d4af37]/30" />
      </div>
    ),
    code: ({ children }: any) => (
      <code className="px-1.5 py-0.5 rounded bg-[#d4af37]/10 text-[#5A4A2F] text-[13px] font-mono">{children}</code>
    ),
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-3 rounded-lg border border-[#e8e0d0]">
        <table className="w-full text-sm text-left">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-[#F5F0E8] text-[#5A4A2F] font-bold">{children}</thead>,
    tbody: ({ children }: any) => <tbody className="divide-y divide-[#e8e0d0]">{children}</tbody>,
    tr: ({ children }: any) => <tr className="hover:bg-[#F5F0E8]/50">{children}</tr>,
    th: ({ children }: any) => <th className="px-4 py-2 text-xs uppercase tracking-wider">{children}</th>,
    td: ({ children }: any) => <td className="px-4 py-2 text-[#3d3425]">{children}</td>,
    a: ({ children, href }: any) => (
      <a href={href} className="text-[#0A1628] underline decoration-[#d4af37]/50 hover:decoration-[#d4af37] transition-colors">
        {children}
      </a>
    ),
  };
}

export function ReflectingIndicator() {
  return (
    <div className="flex justify-start mb-5">
      <div className="rounded-2xl bg-white/90 backdrop-blur-sm border border-[#d4af37]/15 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm text-[#5A4A2F] font-medium italic tracking-wide">
            Nehemiah is reflecting<span className="animate-pulse">...</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  const isSystem = msg.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="px-4 py-2 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20">
          <span className="text-xs text-[#8B7E66] font-medium tracking-wide">{msg.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-5`}>
      <div className={`relative max-w-[85%] md:max-w-[75%] ${isUser ? 'bg-gradient-to-br from-[#0A1628] to-[#132238] text-[#FDF8F0] rounded-2xl rounded-tr-sm shadow-md' : 'bg-white text-[#1E1E1E] rounded-2xl rounded-tl-sm shadow-sm border border-[#e8e0d0]'} px-5 py-4`}>
        {isUser && <div className="absolute top-0 right-0 w-16 h-0.5 bg-gradient-to-l from-[#d4af37] to-transparent rounded-full" />}
        {!isUser && <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#d4af37]/40 rounded-tl-lg" />}

        <article className="prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents({ isUser })}>
            {enrichScriptures(msg.content)}
          </ReactMarkdown>
        </article>

        <div className={`mt-2 text-[10px] ${isUser ? 'text-[#d4af37]/50' : 'text-[#8B7E66]/60'} text-right`}>
          {isUser ? 'You' : 'Nehemiah'}
        </div>
      </div>
    </div>
  );
}

export function ChatMessageList({ messages, loading }: { messages: Message[]; loading: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  return (
    <>
      {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
      {loading && <ReflectingIndicator />}
      <div ref={bottomRef} className="h-4" />
    </>
  );
}