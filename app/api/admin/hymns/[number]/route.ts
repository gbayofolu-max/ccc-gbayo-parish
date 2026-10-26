import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/roles";
import { createEmbedding } from "@/ai/embeddings/jina";

export const runtime = "nodejs";

function parseHymnNumber(value: string): number | null {
  const number = Number.parseInt(value, 10);

  if (!Number.isInteger(number) || number < 1 || number > 9999) {
    return null;
  }

  return number;
}

function clean(value: string): string {
  return value.replace(/\r\n/g, "\n").trim();
}

// Yoruba and English are stored as two separate fields in the row's metadata, so
// what you type in each box is exactly what is saved. Older rows without those
// fields fall back to splitting at the first blank line, and are flagged for review.
function fieldsOf(row: { content: string; metadata: any }) {
  const meta = row.metadata ?? {};

  if (
    typeof meta.yoruba === "string" &&
    typeof meta.english === "string" &&
    `${meta.yoruba}\n\n${meta.english}`.trim() === row.content.trim()
  ) {
    return { yoruba: meta.yoruba as string, english: meta.english as string, needsReview: false };
  }

  const separator = row.content.indexOf("\n\n");

  if (separator === -1) {
    return { yoruba: row.content, english: "", needsReview: true };
  }

  return {
    yoruba: row.content.slice(0, separator),
    english: row.content.slice(separator + 2),
    needsReview: true,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const access = await requireRole(["admin"]);

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { number } = await params;
    const hymnNumber = parseHymnNumber(number);

    if (!hymnNumber) {
      return NextResponse.json({ error: "Invalid hymn number" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("documents")
      .select("id, reference, content, metadata")
      .eq("category", "hymn")
      .eq("reference", `Hymn ${hymnNumber}`)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Hymn not found" }, { status: 404 });
    }

    const { data: history, error: historyError } = await supabaseAdmin
      .from("hymn_edit_log")
      .select(
        "id, hymn_number, admin_user_id, admin_email, changed_fields, old_yoruba, new_yoruba, old_english, new_english, edited_at"
      )
      .eq("hymn_number", hymnNumber)
      .order("edited_at", { ascending: false });

    if (historyError) {
      return NextResponse.json({ error: historyError.message }, { status: 500 });
    }

    const fields = fieldsOf(data);

    return NextResponse.json({
      id: data.id,
      hymn_number: hymnNumber,
      reference: data.reference,
      content: data.content,
      yoruba: fields.yoruba,
      english: fields.english,
      needs_review: fields.needsReview,
      history: history ?? [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const access = await requireRole(["admin"]);

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { number } = await params;
    const hymnNumber = parseHymnNumber(number);

    if (!hymnNumber) {
      return NextResponse.json({ error: "Invalid hymn number" }, { status: 400 });
    }

    const body = await req.json();

    if (typeof body.yoruba !== "string" || typeof body.english !== "string") {
      return NextResponse.json(
        { error: "Both the Yoruba and English text are required" },
        { status: 400 }
      );
    }

    const yoruba = clean(body.yoruba);
    const english = clean(body.english);

    if (!yoruba || !english) {
      return NextResponse.json(
        { error: "Both the Yoruba and English text are required" },
        { status: 400 }
      );
    }

    if (yoruba.length > 20000 || english.length > 20000) {
      return NextResponse.json({ error: "Text is too long" }, { status: 400 });
    }

    const { data: hymn, error: hymnError } = await supabaseAdmin
      .from("documents")
      .select("id, reference, content, metadata")
      .eq("category", "hymn")
      .eq("reference", `Hymn ${hymnNumber}`)
      .maybeSingle();

    if (hymnError) {
      return NextResponse.json({ error: hymnError.message }, { status: 500 });
    }

    if (!hymn) {
      return NextResponse.json({ error: "Hymn not found" }, { status: 404 });
    }

    const before = fieldsOf(hymn);
    const content = `${yoruba}\n\n${english}`;

    const changedFields: string[] = [];

    if (before.yoruba !== yoruba) {
      changedFields.push("yoruba");
    }

    if (before.english !== english) {
      changedFields.push("english");
    }

    if (changedFields.length === 0 && content === hymn.content.trim() && !before.needsReview) {
      return NextResponse.json({
        success: true,
        changed: false,
        message: "No changes detected",
      });
    }

    // Create the new search embedding BEFORE touching the database: if it fails,
    // the saved hymn stays exactly as it was.
    let embedding: number[];

    try {
      embedding = await createEmbedding(content);
    } catch (embedError: any) {
      return NextResponse.json(
        { error: `Could not update the search index, so nothing was saved: ${embedError?.message ?? "unknown error"}` },
        { status: 502 }
      );
    }

    const metadata = {
      ...(hymn.metadata ?? {}),
      yoruba,
      english,
      language_fields: "v1",
      embedding_stale: false,
    };

    const { error: updateError } = await supabaseAdmin
      .from("documents")
      .update({
        content,
        metadata,
        embedding: `[${embedding.join(",")}]`,
      })
      .eq("id", hymn.id)
      .eq("category", "hymn");

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { error: logError } = await supabaseAdmin.from("hymn_edit_log").insert({
      hymn_number: hymnNumber,
      admin_user_id: access.user.id,
      admin_email: access.user.email ?? null,
      changed_fields: changedFields,
      old_yoruba: before.yoruba,
      new_yoruba: yoruba,
      old_english: before.english,
      new_english: english,
    });

    if (logError) {
      return NextResponse.json({
        success: true,
        changed: true,
        warning: "Saved, but the edit-history entry could not be recorded.",
      });
    }

    return NextResponse.json({ success: true, changed: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
