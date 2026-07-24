import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// ── Supabase ──
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ── API Keys ──
const CEREBRAS_KEY = process.env.CEREBRAS_API_KEY;
const GROK_KEY = process.env.GROK_API_KEY;

// ── Clients (OpenAI-compatible SDK) ──
const cerebras = CEREBRAS_KEY
  ? new OpenAI({ apiKey: CEREBRAS_KEY, baseURL: 'https://api.cerebras.ai/v1' })
  : null;

const grok = GROK_KEY
  ? new OpenAI({ apiKey: GROK_KEY, baseURL: 'https://api.x.ai/v1' })
  : null;

// ── Local Embedding Fallback ──
let localModel: any = null;
async function getLocalModel() {
  if (!localModel) {
    const { SentenceTransformer } = await import('sentence-transformers');
    localModel = new SentenceTransformer('all-MiniLM-L6-v2');
  }
  return localModel;
}

// ── 1️⃣ Embed the question ──
async function embedQuestion(text: string): Promise<number[]> {
  if (grok) {
    try {
      const resp = await grok.embeddings.create({
        model: 'grok-embedding',
        input: text,
      });
      return resp.data[0].embedding;
    } catch (e: any) {
      console.warn('⚠️ xAI embedding failed:', e?.message ?? e);
    }
  }

  console.info('🔧 Falling back to local Sentence-Transformer (384-dim)');
  const model = await getLocalModel();
  const vec384 = (await model.encode(text)) as number[];
  const padded = new Array<number>(1536).fill(0);
  padded.splice(0, vec384.length, ...vec384);
  return padded;
}

// ── 2️⃣ Retrieve matching sermon excerpts ──
async function retrieveMatches(embedding: number[], threshold = 0.5, limit = 5) {
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) {
    console.error('Supabase RPC error:', error);
    throw new Error('Database search failed');
  }
  return data || [];
}

// ── 3️⃣ Generate pastor-style answer ──
async function generateAnswer(question: string, excerpts: string[]): Promise<string> {
  const systemPrompt = `You are Pastor Gbayo, a warm, wise, and compassionate spiritual leader. 
You answer questions based on the provided sermon excerpts. 
Speak with love, clarity, and biblical wisdom. 
If the excerpts don't fully answer the question, draw on general biblical knowledge but stay grounded in the provided context.

Sermon excerpts:
${excerpts.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: question },
  ];

  if (cerebras) {
    try {
      const resp = await cerebras.chat.completions.create({
        model: 'llama3.1-8b',
        messages,
        temperature: 0.7,
        max_tokens: 800,
      });
      return resp.choices[0]?.message?.content || 'No response generated.';
    } catch (e: any) {
      console.warn('⚠️ Cerebras failed:', e?.message ?? e);
    }
  }

  if (grok) {
    try {
      const resp = await grok.chat.completions.create({
        model: 'grok-2',
        messages,
        temperature: 0.7,
        max_tokens: 800,
      });
      return resp.choices[0]?.message?.content || 'No response generated.';
    } catch (e: any) {
      console.warn('⚠️ Grok failed:', e?.message ?? e);
    }
  }

  return "Dear friend, I hear your question deeply. While I'm unable to search the sermon archive right now, know that God's word is a lamp unto your feet. Please try again shortly. — Pastor Gbayo";
}

// ── POST Handler ──
export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid question field' },
        { status: 400 }
      );
    }

    const embedding = await embedQuestion(question);
    const matches = await retrieveMatches(embedding);
    const excerpts = matches.map((m: any) => m.content);
    const answer = await generateAnswer(question, excerpts);

    return NextResponse.json({
      answer,
      matches: matches.map((m: any) => ({
        id: m.id,
        content: m.content,
        source: m.source,
        similarity: m.similarity,
      })),
    });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json(
      {
        answer: "I'm experiencing a technical difficulty right now. Please try again in a moment. — Pastor Gbayo",
        matches: [],
        error: err.message,
      },
      { status: 500 }
    );
  }
}