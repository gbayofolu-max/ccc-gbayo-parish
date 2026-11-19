import { NextRequest, NextResponse } from "next/server";
import { askGroq } from "@/ai/llm/groq";

// Turns a short spoken sentence into ONE screen command. Only signed-in staff may use it, and it is rate limited,
// so nobody can run up the AI keys through this address.

const SYSTEM_PROMPT = `You turn short phrases spoken by a preacher in a Nigerian church (English, Yoruba or both) into ONE screen command for the church projector.
The words come from a speech recogniser that makes mistakes. Reply with ONE line of JSON and nothing else.
If the phrase is just preaching, or you are not sure it is a command, reply {"intent":"none"}. Ordinary sentences are always none.

Commands:
{"intent":"hymn","number":"176","language":"english"}  The HYMN BOOK. "hymn number 176", "hymn book 176", "orin 176". The recogniser often hears "hymn" as "him", "hem", "in" or "ham", so "in number 176" and "him number 176" mean hymn 176. Numbers may be spoken "one seventy six" (176) or "one hundred and seventy six". "language" is optional: "yoruba" or "english".
{"intent":"verse","book":"John","chapter":"3","verseStart":"16","verseEnd":"","language":"english"}  A Bible reference. Use the standard English book name (1 Corinthians, Song of Solomon, Psalm, Revelation...). The Bible book is "Numbers" with an S: a plain "number" is never the book. Yoruba book names map to English (Jenesisi=Genesis, Johanu=John, Matiu=Matthew, Orin Dafidi=Psalm). Use language "yoruba" if a Yoruba book name or "in Yoruba" is said, otherwise "english". verseStart and verseEnd may be empty strings.
{"intent":"goto","verse":5}  Go back or forward to a verse that is already on the screen.
{"intent":"scroll","where":"down","amount":"normal"}  where: down, up, top, bottom. amount: small, normal, large.
{"intent":"next"}  {"intent":"previous"}  {"intent":"blank"}  (clear the screen)
{"intent":"pause"}  (wait, hold on, stop)   {"intent":"resume"}  (continue, go on)
{"intent":"language","language":"yoruba"}  (show the current text in Yoruba or English)
{"intent":"define","term":"happiness","language":"english"}  (the meaning or definition of a word or phrase: "let's see the meaning of happiness", "what does it mean to be happy". "term" is just the word or short phrase; "language" is english, yoruba or both, only if one is asked for)
{"intent":"announcement"}  (show the announcements: "announcement", "show the announcements", "ikede")

Common mishearings: "psalm" is often heard as "sam", "salm", "some" or "palm", so "sam 91" means Psalm 91. "next" means the next verse or slide. Yoruba and English are often mixed in one sentence: look for the command inside it, for example "e je ka dide ... orin hymn number 377" is hymn 377.`;

const calls: number[] = [];

async function isSignedIn(request: NextRequest): Promise<boolean> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !key) return false;

  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: key },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isSignedIn(request))) {
      return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    }

    const now = Date.now();
    while (calls.length && now - calls[0] > 60000) calls.shift();
    if (calls.length >= 20) {
      return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
    }
    calls.push(now);

    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text.trim().slice(0, 240) : "";
    if (!text) return NextResponse.json({ error: "Text is required." }, { status: 400 });

    const onScreen = ["bible", "text", "nothing"].includes(body?.onScreen) ? body.onScreen : "nothing";

    const answer = await askGroq([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `On the projector now: ${onScreen}.\nPhrase: "${text}"` },
    ]);

    if (!answer) return NextResponse.json({ intent: { intent: "none" } });

    const match = answer.match(/\{[\s\S]*?\}/);
    let intent: unknown = { intent: "none" };
    try {
      if (match) intent = JSON.parse(match[0]);
    } catch {
      intent = { intent: "none" };
    }

    return NextResponse.json({ intent });
  } catch (error) {
    console.error("VOICE INTENT ERROR:", error);
    return NextResponse.json({ intent: { intent: "none" } });
  }
}
