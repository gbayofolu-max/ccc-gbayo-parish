'use client';

import { useState } from 'react';

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
};

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    '**Welcome, beloved.** I am **Nehemiah AI**, your Digital Ministry Companion.\n\nAsk me about Scripture, sermons, Bible lessons, and the life of CCC Gbayo Parish. May the Lord grant you wisdom and peace as we fellowship together.',
};

export function useNehemiahChat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);

  async function sendMessage(rawQuestion: string) {
    const question = rawQuestion.trim();
    if (!question || loading) return;

    const userId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: userId, role: 'user', content: question }]);
    setLoading(true);

    try {
      const res = await fetch('/api/nehemiah/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const answer = data?.answer?.response ?? data?.answer ?? 'I could not generate a response.';

      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: answer }]);
    } catch (err: any) {
      console.error('[NehemiahChat] Send failed:', err);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: `**Something went wrong.**\n\n${err.message}\n\nPlease try again.` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return { messages, loading, sendMessage, isFresh: messages.length === 1 };
}