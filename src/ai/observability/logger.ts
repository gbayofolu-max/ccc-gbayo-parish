import { supabaseAdmin } from "@/lib/supabase/server";

interface PipelineLogEntry {
  question: string;
  embeddingMs?: number;
  searchMs?: number;
  matchesCount?: number;
  usedFallbackSearch?: boolean;
  llmProvider?: "cerebras" | "groq";
  llmMs?: number;
  totalMs: number;
  status: "success" | "error";
  errorMessage?: string;
}

export async function logPipelineRun(entry: PipelineLogEntry) {
  // Always log to console for local dev visibility
  console.log("[Pipeline Log]", entry);

  // Fire-and-forget persist to Supabase — never let logging break the actual request
  try {
    await supabaseAdmin.from("pipeline_logs").insert({
      question: entry.question.slice(0, 500),
      embedding_ms: entry.embeddingMs ?? null,
      search_ms: entry.searchMs ?? null,
      matches_count: entry.matchesCount ?? null,
      used_fallback_search: entry.usedFallbackSearch ?? null,
      llm_provider: entry.llmProvider ?? null,
      llm_ms: entry.llmMs ?? null,
      total_ms: entry.totalMs,
      status: entry.status,
      error_message: entry.errorMessage ?? null,
    });
  } catch (err) {
    console.error("[Pipeline Log] Failed to persist to Supabase:", err);
  }
}