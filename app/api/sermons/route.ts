import { NextRequest, NextResponse } from "next/server";
import { createRequire } from "module";
import { supabaseAdmin } from "@/lib/supabase/server";
import { embedSermonText } from "@/ai/sermons/embedSermon";
import { generateDailyPosts } from "@/ai/sermons/generatePosts";

export const runtime = "nodejs";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse-fork");

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const title = ((formData.get("title") as string) || "").trim();
    const preachedOn =
      (formData.get("preached_on") as string) || new Date().toISOString().slice(0, 10);
    const slidesUrl = ((formData.get("slides_url") as string) || "").trim() || null;
    const pastedText = ((formData.get("full_text") as string) || "").trim();
    const pdfFile = formData.get("pdf") as File | null;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let fullText = pastedText;

    if (!fullText && pdfFile) {
      const buffer = Buffer.from(await pdfFile.arrayBuffer());
      const parsed = await pdfParse(buffer);
      fullText = (parsed.text || "").trim();
    }

    if (!fullText) {
      return NextResponse.json(
        { error: "Provide either pasted sermon text or a PDF file" },
        { status: 400 }
      );
    }

    const { data: sermon, error: insertError } = await supabaseAdmin
      .from("sermons")
      .insert({
        title,
        preached_on: preachedOn,
        slides_url: slidesUrl,
        full_text: fullText,
        status: "processing",
      })
      .select()
      .single();

    if (insertError || !sermon) {
      return NextResponse.json(
        { error: insertError?.message || "Failed to save sermon" },
        { status: 500 }
      );
    }

    try {
      await embedSermonText(sermon.id, title, fullText);

      const generatedPosts = await generateDailyPosts(title, fullText);

      const rows = generatedPosts.map((p, i) => ({
        sermon_id: sermon.id,
        day_index: i + 1,
        title: p.title,
        body: p.body,
        slug: `${slugify(p.title)}-${sermon.id}-${i + 1}`,
        status: "draft",
      }));

      const { error: postsError } = await supabaseAdmin.from("sermon_posts").insert(rows);
      if (postsError) throw new Error(postsError.message);

      await supabaseAdmin
        .from("sermons")
        .update({ status: "ready", updated_at: new Date().toISOString() })
        .eq("id", sermon.id);

      return NextResponse.json({ sermonId: sermon.id, postsGenerated: rows.length });
    } catch (processingError: any) {
      await supabaseAdmin
        .from("sermons")
        .update({
          status: "error",
          error_message: processingError?.message?.slice(0, 500) ?? "Unknown error",
          updated_at: new Date().toISOString(),
        })
        .eq("id", sermon.id);

      return NextResponse.json(
        {
          error: "Sermon saved, but processing failed: " + processingError.message,
          sermonId: sermon.id,
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
