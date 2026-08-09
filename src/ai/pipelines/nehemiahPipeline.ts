import { createEmbedding } from "@/ai/embeddings/jina";
import { searchDocuments } from "@/ai/search/search";
import { createSystemPrompt } from "@/ai/prompts/systemPrompt";
import { askCerebras } from "@/ai/llm/cerebras";
import { askGroq } from "@/ai/llm/groq";
import { logPipelineRun } from "@/ai/observability/logger";
import { supabaseAdmin } from "@/lib/supabase/server";


interface NehemiahPipelineInput {
  question: string;
}


// Detects a direct "hymn N" style question and does an exact
// database lookup by number, bypassing vector search entirely.
// Vector similarity is probabilistic and not reliable for "give me
// exactly item #N" questions — an exact match is both faster and
// guaranteed correct when the person asks for a specific hymn.
async function tryExactHymnLookup(question: string) {
  const match = question.match(/\bhymn\s*#?\s*(\d{1,4})\b/i);
  if (!match) return null;

  const hymnNumber = parseInt(match[1], 10);

  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("content, reference")
    .eq("category", "hymn")
    .eq("reference", `Hymn ${hymnNumber}`)
    .maybeSingle();

  if (error || !data) return null;

  return {
    hymnNumber,
    documents: [{ content: data.content, reference: data.reference }],
  };
}


export async function nehemiahPipeline(
  input: NehemiahPipelineInput
) {

  const startTime = Date.now();

  const { question } = input;


  let embeddingMs: number | undefined;
  let searchMs: number | undefined;
  let matchesCount: number | undefined;
  let usedFallbackSearch: boolean | undefined;
  let usedExactHymnLookup: boolean = false;
  let llmProvider: "cerebras" | "groq" | undefined;
  let llmMs: number | undefined;


  try {

    let documents: any[];

    const exactHymn = await tryExactHymnLookup(question);

    if (exactHymn) {

      console.log("[Exact Lookup] Hymn number detected", { hymnNumber: exactHymn.hymnNumber });

      documents = exactHymn.documents;
      usedExactHymnLookup = true;
      usedFallbackSearch = false;
      matchesCount = documents.length;
      searchMs = 0;
      embeddingMs = 0;

    } else {

      const embeddingStart = Date.now();

      const embedding = await createEmbedding(question);

      embeddingMs = Date.now() - embeddingStart;


      const searchStart = Date.now();

      documents = await searchDocuments(embedding);

      usedFallbackSearch = false;

      if (documents.length === 0) {
        usedFallbackSearch = true;
        documents = await searchDocuments(embedding, {
          matchThreshold: -1,
          matchCount: 3,
        });
      }

      searchMs = Date.now() - searchStart;
      matchesCount = documents.length;

    }


    const excerpts = documents.map((doc: any) => ({
      content: doc.content,
      reference: doc.reference || null,
    }));

    const systemPrompt = createSystemPrompt(excerpts, usedFallbackSearch ?? false);

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ];


    try {

      const llmStart = Date.now();

      const response = await askCerebras(messages);

      if (response) {

        llmProvider = "cerebras";
        llmMs = Date.now() - llmStart;

        await logPipelineRun({
          question,
          embeddingMs,
          searchMs,
          matchesCount,
          usedFallbackSearch,
          llmProvider,
          llmMs,
          totalMs: Date.now() - startTime,
          status: "success",
        });

        return response;

      }

      throw new Error("Cerebras returned no response");

    } catch (llmError) {

      const llmStart = Date.now();

      const fallback = await askGroq(messages);

      llmProvider = "groq";
      llmMs = Date.now() - llmStart;

      await logPipelineRun({
        question,
        embeddingMs,
        searchMs,
        matchesCount,
        usedFallbackSearch,
        llmProvider,
        llmMs,
        totalMs: Date.now() - startTime,
        status: "success",
      });

      return fallback;

    }

  } catch (error: any) {

    await logPipelineRun({
      question,
      embeddingMs,
      searchMs,
      matchesCount,
      usedFallbackSearch,
      llmProvider,
      llmMs,
      totalMs: Date.now() - startTime,
      status: "error",
      errorMessage: error?.message?.slice(0, 500) ?? "Unknown error",
    });

    throw error;

  }

}