import { NextRequest, NextResponse } from "next/server";
import { BOOK_ORDER, resolveBookName, fetchVersesFromSource } from "@/ai/bible/lookup";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.type === "verse") {
    const book = resolveBookName(body.book || "");
    if (!book) {
      return NextResponse.json({ error: "Book not recognized" }, { status: 400 });
    }

    const chapter = parseInt(body.chapter, 10);
    if (!chapter) {
      return NextResponse.json({ error: "Chapter is required" }, { status: 400 });
    }

    const verseStart = body.verseStart ? parseInt(body.verseStart, 10) : undefined;
    const verseEnd = body.verseEnd ? parseInt(body.verseEnd, 10) : undefined;
    const source = body.language === "yoruba" ? "Yoruba Bible" : "KJV Bible";

    const result = await fetchVersesFromSource(source, book, chapter, verseStart, verseEnd);
    if (!result) {
      return NextResponse.json({ error: "Verse not found" }, { status: 404 });
    }

    return NextResponse.json({
      content_type: "verse",
      title: result.reference,
      body_text: result.content,
      reference: result.reference,
      language: body.language === "yoruba" ? "Yorùbá" : "English (KJV)",
      verses: result.verses,
    });
  }

  if (body.type === "hymn") {
    const hymnNumber = parseInt(body.number, 10);
    if (!hymnNumber) {
      return NextResponse.json({ error: "Hymn number is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("documents")
      .select("content, reference")
      .eq("category", "hymn")
      .eq("reference", `Hymn ${hymnNumber}`)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "Hymn not found" }, { status: 404 });
    }

    return NextResponse.json({
      content_type: "hymn",
      title: data.reference,
      body_text: data.content,
      reference: data.reference,
      language: null,
      verses: null,
    });
  }

  if (body.type === "books") {
    return NextResponse.json({ books: BOOK_ORDER });
  }

  return NextResponse.json({ error: "Unknown lookup type" }, { status: 400 });
}
