import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { embedHymn } from "@/ai/hymns/embedHymn";

export const runtime = "nodejs";

function parseHymnNumber(value: string): number | null {
  const number = Number.parseInt(value, 10);

  if (!Number.isInteger(number) || number < 1 || number > 9999) {
    return null;
  }

  return number;
}

function splitHymnContent(content: string) {
  const separator = content.indexOf("\n\n");

  if (separator === -1) {
    return {
      yoruba: content,
      english: "",
    };
  }

  return {
    yoruba: content.slice(0, separator),
    english: content.slice(separator + 2),
  };
}

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, admin: null };
  }

  const { data: adminRow, error } = await supabaseAdmin
    .from("admin_users")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !adminRow) {
    return { user, admin: null };
  }

  return { user, admin: adminRow };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { user, admin } = await requireAdmin();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { number } = await params;
    const hymnNumber = parseHymnNumber(number);

    if (!hymnNumber) {
      return NextResponse.json(
        { error: "Invalid hymn number" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("documents")
      .select("id, reference, content")
      .eq("category", "hymn")
      .eq("reference", `Hymn ${hymnNumber}`)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Hymn not found" },
        { status: 404 }
      );
    }

    const { data: history, error: historyError } = await supabaseAdmin
      .from("hymn_edit_log")
      .select(
        "id, hymn_number, admin_user_id, admin_email, changed_fields, old_yoruba, new_yoruba, old_english, new_english, edited_at"
      )
      .eq("hymn_number", hymnNumber)
      .order("edited_at", { ascending: false });

    if (historyError) {
      return NextResponse.json(
        { error: historyError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id,
      hymn_number: hymnNumber,
      reference: data.reference,
      content: data.content,
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
    const { user, admin } = await requireAdmin();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { number } = await params;
    const hymnNumber = parseHymnNumber(number);

    if (!hymnNumber) {
      return NextResponse.json(
        { error: "Invalid hymn number" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const content =
      typeof body.content === "string" ? body.content : "";

    if (!content.trim()) {
      return NextResponse.json(
        { error: "Hymn content cannot be empty" },
        { status: 400 }
      );
    }

    const { data: hymn, error: hymnError } = await supabaseAdmin
      .from("documents")
      .select("id, reference, content")
      .eq("category", "hymn")
      .eq("reference", `Hymn ${hymnNumber}`)
      .maybeSingle();

    if (hymnError) {
      return NextResponse.json(
        { error: hymnError.message },
        { status: 500 }
      );
    }

    if (!hymn) {
      return NextResponse.json(
        { error: "Hymn not found" },
        { status: 404 }
      );
    }

    if (content === hymn.content) {
      return NextResponse.json({
        success: true,
        changed: false,
        message: "No changes detected",
      });
    }

    const oldParts = splitHymnContent(hymn.content);
    const newParts = splitHymnContent(content);

    const changedFields: string[] = [];

    if (oldParts.yoruba !== newParts.yoruba) {
      changedFields.push("yoruba");
    }

    if (oldParts.english !== newParts.english) {
      changedFields.push("english");
    }

    /*
     * Generate the new embedding BEFORE changing the database.
     * If Jina fails, the existing hymn remains untouched.
     */
    let embedding: number[];

    try {
      embedding = await embedHymn(content);
    } catch (embeddingError: any) {
      return NextResponse.json(
        {
          error:
            "Hymn was not changed because re-embedding failed: " +
            (embeddingError?.message ?? "Unknown embedding error"),
        },
        { status: 502 }
      );
    }

    if (!Array.isArray(embedding) || embedding.length !== 1536) {
      return NextResponse.json(
        {
          error:
            "Hymn was not changed because the generated embedding was invalid.",
        },
        { status: 502 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("documents")
      .update({
        content,
        embedding,
      })
      .eq("id", hymn.id)
      .eq("category", "hymn")
      .eq("reference", `Hymn ${hymnNumber}`);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    const { error: logError } = await supabaseAdmin
      .from("hymn_edit_log")
      .insert({
        hymn_number: hymnNumber,
        admin_user_id: user.id,
        admin_email: user.email ?? null,
        changed_fields: changedFields,
        old_yoruba:
          changedFields.includes("yoruba") ? oldParts.yoruba : null,
        new_yoruba:
          changedFields.includes("yoruba") ? newParts.yoruba : null,
        old_english:
          changedFields.includes("english") ? oldParts.english : null,
        new_english:
          changedFields.includes("english") ? newParts.english : null,
      });

    if (logError) {
      return NextResponse.json(
        {
          success: true,
          changed: true,
          hymn_number: hymnNumber,
          warning:
            "Hymn and embedding were updated, but the edit log could not be written: " +
            logError.message,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      changed: true,
      hymn_number: hymnNumber,
      changed_fields: changedFields,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
