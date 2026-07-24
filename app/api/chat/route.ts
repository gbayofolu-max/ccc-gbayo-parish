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
// 3️⃣ LLM Helpers
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
          content: `You are Pastor John Gbayo, a warm, compassionate spiritual guide for the Celestial Church of Christ – Gbayo Parish. You speak with biblical wisdom, love, and authority.

INSTRUCTIONS:
- If relevant sermon excerpts are provided below, base your answer on them and expand with your pastoral insight.
- If NO excerpts are provided, answer from your deep biblical knowledge and pastoral experience as if you are teaching directly from the pulpit.
- NEVER mention "excerpts," "documents," "Cerebras," "Groq," "AI," or any technology. Speak as a human pastor.
- Always sign off as "Pastor John Gbayo, Gbayo Parish, Celestial Church of Christ."
- End with a short prayer or blessing.` 
        },
        { 
          role: 'user', 
          content: `QUESTION: ${question}\n\n${context ? `RELEVANT SERMON EXCERPTS:\n${context}\n\n` : ''}Please answer as Pastor John Gbayo.` 
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
          content: `You are Pastor John Gbayo, a warm, compassionate spiritual guide for the Celestial Church of Christ – Gbayo Parish. You speak with biblical wisdom, love, and authority.

INSTRUCTIONS:
- If relevant sermon excerpts are provided below, base your answer on them and expand with your pastoral insight.
- If NO excerpts are provided, answer from your deep biblical knowledge and pastoral experience as if you are teaching directly from the pulpit.
- NEVER mention "excerpts," "documents," "Cerebras," "Groq," "AI," or any technology. Speak as a human pastor.
- Always sign off as "Pastor John Gbayo, Gbayo Parish, Celestial Church of Christ."
- End with a short prayer or blessing.` 
        },
        { 
          role: 'user', 
          content: `QUESTION: ${question}\n\n${context ? `RELEVANT SERMON EXCERPTS:\n${context}\n\n` : ''}Please answer as Pastor John Gbayo.` 
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
  const context = excerpts.length > 0 
    ? excerpts.map((e, i) => `#${i + 1}: ${e}`).join('\n\n')
    : '';
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

    console.log('🔥 ROUTE.TS RUNNING — Question:', question);

    const queryVector = await embedQuestion(question);
    console.log('✅ Embedding generated, length:', queryVector.length);

    const { data, error } = await supabase.rpc('match_documents', {
      query_vector: queryVector,
      match_count: 5,
      match_threshold: 0.3,
    });

    if (error) {
      console.error('❌ Supabase RPC error:', error);
      throw error;
    }

    console.log('✅ Matches found:', data?.length ?? 0);

    const matches = (data ?? []) as Array<{ id: number; content: string; source: string | null; similarity: number }>;
    const excerpts = matches.map(m => (m.content ?? '').slice(0, 300));

    const answer = await generateAnswer(question, excerpts);

    return NextResponse.json({
      answer,
      matches: matches.map(m => ({
        id: m.id,
        excerpt: (m.content ?? '').slice(0, 300),
        source: m.source ?? null,
        similarity: m.similarity,
      })),
    });

  } catch (err: any) {
    console.error('🚨 FULL ERROR:', err);
    return NextResponse.json({
      answer: 'Beloved, I am having trouble accessing the records right now. Please try again a moment later.',
      matches: [],
    }, { status: 500 });
  }
}
