import { NextRequest, NextResponse } from "next/server";
import { askGroq } from "@/ai/llm/groq";

// Writes a short, plain-language meaning of a word or phrase for the projector. Only signed-in staff may use it; it is rate limited.

const calls: number[] = [];

async function isSignedIn(request: NextRequest): Promise<boolean> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !key) return false;
  try {
    const res = await fetch(`${url}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: key }, cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

const clean = (v: unknown, max = 400) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

export async function POST(request: NextRequest) {
  try {
    if (!(await isSignedIn(request))) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

    const now = Date.now();
    while (calls.length && now - calls[0] > 60000) calls.shift();
    if (calls.length >= 10) return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
    calls.push(now);

    const body = await request.json();
    const term = clean(body?.term, 60);
    if (!/^[\p{L}\p{M}' -]{1,60}$/u.test(term)) return NextResponse.json({ error: "That does not look like a word." }, { status: 400 });
    const wantYoruba = body?.language === "yoruba" || body?.language === "both";

    const system = `You explain words and short phrases for a church congregation, in plain, simple language that a teenager can follow.
Reply with ONE JSON object and nothing else, with these keys:
{"term":"the word or phrase, tidily written","partOfSpeech":"noun, verb, adjective, adverb or phrase","english":"a clear meaning in 1 or 2 short sentences","example":"one short example sentence suitable for church"${
      wantYoruba ? `,"yoruba":"the same meaning in simple, correct Yoruba with tone marks","yorubaExample":"the example sentence in Yoruba"` : ""
    }}
If the term is a Yoruba word, give its meaning in English as well.${wantYoruba ? " If you are not sure of a Yoruba word, write the English word in brackets instead of guessing." : ""}
Never invent Bible verses. Keep every field under 220 characters.`;

    const answer = await askGroq([
      { role: "system", content: system },
      { role: "user", content: `Term: "${term}"` },
    ]);
    if (!answer) return NextResponse.json({ error: "No answer from the AI." }, { status: 502 });

    const match = answer.match(/\{[\s\S]*\}/);
    let parsed: any = null;
    try {
      parsed = match ? JSON.parse(match[0]) : null;
    } catch {
      parsed = null;
    }
    const english = clean(parsed?.english);
    if (!english) return NextResponse.json({ error: "The AI did not give a meaning." }, { status: 502 });

    return NextResponse.json({
      term: clean(parsed?.term, 60) || term,
      partOfSpeech: clean(parsed?.partOfSpeech, 30),
      english,
      example: clean(parsed?.example),
      yoruba: wantYoruba ? clean(parsed?.yoruba) : "",
      yorubaExample: wantYoruba ? clean(parsed?.yorubaExample) : "",
    });
  } catch (error) {
    console.error("VOICE DEFINE ERROR:", error);
    return NextResponse.json({ error: "Could not look that up." }, { status: 500 });
  }
}
