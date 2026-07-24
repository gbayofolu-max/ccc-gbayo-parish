import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// -------------------------------------------------------------
// 0️⃣ Supabase Configuration
// -------------------------------------------------------------
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// -------------------------------------------------------------
// 1️⃣ Local Embedding Model (FREE — No API Key needed)
// -------------------------------------------------------------
let embedder: any = null;

async function getEmbedder() {
  if (!embedder) {
    const { pipeline } = await import('@xenova/transformers');
    embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      { quantized: true }
    );
  }
  return embedder;
}

async function embedQuestion(text: string): Promise<number[]> {
  console.info('🔧 Generating local embedding...');
  const extractor = await getEmbedder();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  const vec384 = Array.from(output.data) as number[];
  
  // Pad to 1536 to match your Supabase vector(1536) column
  const padded = new Array<number>(1536).fill(0);
  for (let i = 0; i < vec384.length; i++) {
    padded[i] = vec384[i];
  }
  return padded;
}

// -------------------------------------------------------------
// 2️⃣ API Key Rotators (Cerebras & Groq)
// -------------------------------------------------------------
const CEREBRAS_KEYS = [
  process.env.CEREBRAS_KEY_1, process.env.CEREBRAS_KEY_2, process.env.CEREBRAS_KEY_3,
  process.env.CEREBRAS_KEY_4, process.env.CEREBRAS_KEY_5, process.env.CEREBRAS_KEY_6
].filter(Boolean) as string[];

const GROQ_KEYS = [
  process.env.GROQ_KEY_1, process.env.GROQ_KEY_2, process.env.GROQ_KEY_3,
  process.env.GROQ_KEY_4, process.env.GROQ_KEY_5, process.env.GROQ_KEY_6
].filter(Boolean) as string[];

// -------------------------------------------------------------
// 3️⃣ LLM Helpers — Updated to Current Working Models (2026)
// -------------------------------------------------------------
async function tryCerebras(key: string, question: string, context: string): Promise<string> {
  const resp = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${key}`, 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({
      model: 'gpt-oss-120b',
      messages: [
        { 
          role: 'system', 
          content: `You are Pastor John Gbayo, a warm, compassionate guide for the Celestial Church of Christ – Gbayo Parish. Answer using his biblical, community-focused voice. Only use the supplied sermon excerpts; do NOT hallucinate.` 
        },
        { 
          role: 'user', 
          content: `Question: ${question}\n\nRelevant excerpts:\n${context}` 
        }
      ],
      temperature: 0.7,
      max_tokens: 1024,
    })
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Cerebras Error ${resp.status}: ${errText}`);
  }
  const data = await resp.json();
  return data.choices[0].message.content;
}

async function tryGroq(key: string, question: string, context: string): Promise<string> {
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${key}`, 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [
        { 
          role: 'system', 
          content: `You are Pastor John Gbayo, a warm, compassionate guide for the Celestial Church of Christ – Gbayo Parish. Answer using his biblical, community-focused voice. Only use the supplied sermon excerpts; do NOT hallucinate.` 
        },
        { 
          role: 'user', 
          content: `Question: ${question}\n\nRelevant excerpts:\n${context}` 
        }
      ],
      temperature: 0.7,
      max_tokens: 1024,
    })
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Groq Error ${resp.status}: ${errText}`);
  }
  const data = await resp.json();
  return data.choices[0].message.content;
}

// -------------------------------------------------------------
// 4️⃣ Main Answer Generator with 12-Key Failover
// -------------------------------------------------------------
async function generateAnswer(question: string, excerpts: string[]): Promise<string> {
  const context = excerpts.map((e, i) => `#${i + 1}: ${e}`).join('\n');
  let answer: string | null = null;

  for (let i = 0; i < CEREBRAS_KEYS.length; i++) {
    try {
      console.log(`Trying Cerebras Key #${i + 1}...`);
      answer = await tryCerebras(CEREBRAS_KEYS[i], question, context);
      if (answer) break;
    } catch (e) {
      console.warn(`⚠️ Cerebras Key #${i + 1} failed. Switching...`);
    }
  }

  if (!answer) {
    for (let i = 0; i < GROQ_KEYS.length; i++) {
      try {
        console.log(`Trying Groq Key #${i + 1}...`);
        answer = await tryGroq(GROQ_KEYS[i], question, context);
        if (answer) break;
      } catch (e) {
        console.warn(`⚠️ Groq Key #${i + 1} failed. Switching...`);
      }
    }
  }

  if (!answer) throw new Error('❌ All 12 API keys exhausted');
  return answer;
}

// -------------------------------------------------------------
// 5️⃣ POST handler
// -------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    if (!question) {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 });
    }

    const queryVector = await embedQuestion(question);

    const { data, error } = await supabase.rpc('match_documents', {
      query_vector: queryVector,
      match_count: 5,
    });

    if (error) throw error;

    const matches = (data ?? []) as Array<{ id: number; content: string; source: string | null }>;
    const excerpts = matches.map(m => (m.content ?? '').slice(0, 300));

    const answer = await generateAnswer(question, excerpts);

    return NextResponse.json({
      answer,
      matches: matches.map(m => ({
        id: m.id,
        excerpt: (m.content ?? '').slice(0, 300),
        source: m.source ?? null,
      })),
    });

  } catch (err: any) {
    console.error('🚨 Cele API fatal error →', err);
    return NextResponse.json({
      answer: 'Beloved, I am having trouble accessing the records right now. Please try again a moment later.',
      matches: [],
    }, { status: 500 });
  }
}