const fs = require('fs');
const content = `import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CEREBRAS_KEY = process.env.CEREBRAS_API_KEY;
const GROK_KEY = process.env.GROK_API_KEY;
const JINA_KEY = process.env.JINA_API_KEY;

async function embed(text: string): Promise<number[]> {
  if (JINA_KEY === undefined || JINA_KEY === null || JINA_KEY === "") {
    throw new Error("JINA_API_KEY missing in .env.local");
  }
  const res = await fetch("https://api.jina.ai/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + JINA_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "jina-embeddings-v3", input: text }),
  });
  if (res.ok === false) {
    throw new Error("Jina HTTP " + res.status);
  }
  const json = await res.json();
  const vec1024 = json.data[0].embedding as number[];
  const padded = new Array(1536).fill(0);
  padded.splice(0, vec1024.length, ...vec1024);
  return padded;
}

async function search(embedding: number[]) {
  if (SUPABASE_URL === undefined || SUPABASE_KEY === undefined) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
  }
  const res = await fetch(SUPABASE_URL + "/rest/v1/rpc/match_documents", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + SUPABASE_KEY,
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5,
      filter_category: null,
    }),
  });
  const responseText = await res.text();
  if (res.ok === false) {
    throw new Error("Supabase HTTP " + res.status + ": " + responseText.substring(0, 200));
  }
  const parsed = JSON.parse(responseText);
  return parsed ? parsed : [];
}

async function chat(question: string, excerpts: string[]): Promise<string> {
  const system = "You are Pastor Gbayo, a warm, wise, and compassionate spiritual leader.\\nAnswer based on these sermon excerpts. Speak with love, clarity, and biblical wisdom.\\n\\nSermon excerpts:\\n" + excerpts.map((e, i) => (i + 1) + ". " + e).join("\\n");

  const messages = [
    { role: "system", content: system },
    { role: "user", content: question },
  ];

  if (CEREBRAS_KEY) {
    const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + CEREBRAS_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.1-8b",
        messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      const content = json.choices[0]?.message?.content;
      return content ? content : "No response";
    }
    console.warn("Cerebras failed:", res.status, await res.text());
  }

  if (GROK_KEY) {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + GROK_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-4.5",
        messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      const content = json.choices[0]?.message?.content;
      return content ? content : "No response";
    }
    console.warn("Grok failed:", res.status, await res.text());
  }

  return "Dear friend, I hear your question deeply. While I am unable to search the sermon archive right now, know that God's word is a lamp unto your feet. Please try again shortly. — Pastor Gbayo";
}

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    const isString = typeof question === "string";
    if (question === undefined || question === null || isString === false) {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    const embedding = await embed(question);
    const matches = await search(embedding);
    const excerpts = matches.map((m: any) => m.content);
    const answer = await chat(question, excerpts);

    return NextResponse.json({
      answer,
      matches: matches.map((m: any) => ({
        id: m.id,
        content: m.content,
        source: m.source,
        similarity: m.similarity,
      })),
    });
  } catch (err: unknown) {
    console.error("API Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        answer: "I am experiencing a technical difficulty right now. Please try again in a moment. — Pastor Gbayo",
        matches: [],
        error: message,
      },
      { status: 500 }
    );
  }
}
`;

fs.writeFileSync("app/api/cele/query/route.ts", content, "utf8");
console.log("Wrote", content.length, "bytes to route.ts");
