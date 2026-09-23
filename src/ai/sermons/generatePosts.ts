import { askCerebras } from "@/ai/llm/cerebras";
import { askGroq } from "@/ai/llm/groq";
import { askGemini } from "@/ai/llm/gemini";

export interface GeneratedPost {
  title: string;
  body: string;
}

async function askAnyProvider(messages: any[]): Promise<string> {
  const providers = [askGroq, askGemini, askCerebras];
  for (const fn of providers) {
    try {
      const result = await fn(messages);
      if (result) return result;
    } catch {
      // try next provider
    }
  }
  throw new Error("All LLM providers failed while generating sermon posts");
}

export async function generateDailyPosts(
  sermonTitle: string,
  sermonText: string
): Promise<GeneratedPost[]> {
  const systemPrompt = `You are a pastoral content writer for CCC Gbayo Parish, a Celestial Church of Christ parish. Given the full text of a Sunday sermon, break it into a set of short, standalone daily devotional posts that can be shared one per day throughout the week.

Rules:
- Choose however many posts genuinely fit the sermon's distinct themes or points — typically between 4 and 7, but let the content decide, don't pad or force a number.
- Each post must stand alone — someone reading only that post, with no other context, should get real value from it.
- Each post: a short, warm title (under 60 characters), and a body of about 120-220 words in a pastoral, encouraging voice.
- Do not simply summarize the sermon chronologically — extract distinct, standalone ideas.
- Never invent scripture references that are not clearly present in the sermon text. If the sermon mentions a specific verse, you may reference it; otherwise speak in general terms.
- Respond with ONLY a JSON array, nothing else, no markdown fences, no preamble. Format:
[{"title": "...", "body": "..."}, ...]`;

  const userMessage = `Sermon title: ${sermonTitle}\n\nSermon text:\n${sermonText}`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  const raw = await askAnyProvider(messages);
  const cleaned = raw.replace(/```json|```/g, "").trim();

  let parsed: GeneratedPost[];
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error("Failed to parse AI response as JSON: " + (err as Error).message);
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("AI response was not a valid non-empty array of posts");
  }

  return parsed.filter((p) => p.title && p.body);
}
