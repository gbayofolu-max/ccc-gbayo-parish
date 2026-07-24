'use client';

import { useState } from 'react';

export default function CelePage() {
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('Sermon');
  const [ministryValue, setMinistryValue] = useState('kingdom');
  const [answer, setAnswer] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/cele/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, category, ministry_value: ministryValue }),
    });
    const data = await res.json();
    setAnswer(data);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Cele — Your Ministry AI</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Ask Cele: 'What do you say about obedience?'"
          className="w-full px-4 py-3 border rounded"
        />
        <div className="flex gap-2">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="Sermon">Sermons</option>
            <option value="Hymn">Hymns</option>
            <option value="Lesson">Lessons</option>
          </select>
          <select
            value={ministryValue}
            onChange={e => setMinistryValue(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="kingdom">Kingdom Focus</option>
            <option value="reverence">Reverence</option>
            <option value="teaching">Teaching</option>
            <option value="tradition">Tradition</option>
          </select>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            Ask Cele
          </button>
        </div>
      </form>

      {answer?.error && <div className="text-red-500">{answer.error}</div>}
      {answer?.answer?.response && (
        <div className="border rounded p-4 bg-gray-50 mb-6">
          <p className="whitespace-pre-line">{answer.answer.response}</p>
        </div>
      )}
      {!answer?.answer?.response && (
        <p className="text-gray-500">
          Try: "What do you say about holiness?" or "Help me prepare a sermon on forgiveness."
        </p>
      )}

      {/* Floating Angelic Visual Element */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white p-2 rounded-full shadow-lg mb-2"
        >
          ✨
        </button>
        {isOpen && (
          <div className="bg-white p-4 rounded-lg shadow-xl max-w-xs">
            <h3 className="font-bold mb-2">Cele Assistant</h3>
            <p className="text-sm text-gray-600">
              Ready to answer questions about your ministry materials
            </p>
          </div>
        )}
      </div>
    </div>
  );
}