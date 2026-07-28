import { NextRequest, NextResponse } from "next/server";

import { createEmbedding } from "@/ai/embeddings/jina";
import { searchDocuments } from "@/ai/search/search";
import { createSystemPrompt } from "@/ai/prompts/systemPrompt";
import { askCerebras } from "@/ai/llm/cerebras";
import { askGroq } from "@/ai/llm/groq";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const question = body?.question?.trim();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required." },
        { status: 400 }
      );
    }

    const embedding = await createEmbedding(question);
    const matches = await searchDocuments(embedding);

    return NextResponse.json({
      success: true,
      question,
      embeddingDimensions: embedding.length,
      matchesFound: matches.length,
      matches,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error.",
      },
      {
        status: 500,
      }
    );
  }
}
