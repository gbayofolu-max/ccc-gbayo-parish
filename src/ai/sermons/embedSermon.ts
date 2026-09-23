import { supabaseAdmin } from "@/lib/supabase/server";

const JINA_KEYS: string[] = [];
if (process.env.JINA_API_KEY) JINA_KEYS.push(process.env.JINA_API_KEY);
for (let i = 2; i <= 10; i++) {
  const k = process.env[`JINA_KEY_${i}`] || process.env[`JINA_API_KEY_${i}`];
  if (k) JINA_KEYS.push(k);
}

let currentKeyIndex = 0;
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pad1536(vec: number[]): number[] {
  const padded = new Array(1536).fill(0);
  for (let i = 0; i < vec.length && i < 1536; i++) padded[i] = vec[i];
  return padded;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  if (JINA_KEYS.length === 0) throw new Error("No Jina API key configured");

  const maxCycles = 2;
  for (let cycle = 0; cycle < maxCycles; cycle++) {
    for (let attempt = 0; attempt < JINA_KEYS.length; attempt++) {
      const key = JINA_KEYS[currentKeyIndex];
      try {
        const res = await fetch("https://api.jina.ai/v1/embeddings", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "jina-embeddings-v3", input: texts }),
        });
        if (res.ok) {
          const json = await res.json();
          return json.data.map((d: any) => pad1536(d.embedding as number[]));
        }
      } catch {
        // try next key
      }
      currentKeyIndex = (currentKeyIndex + 1) % JINA_KEYS.length;
    }
    await sleep(5000);
  }

  throw new Error("All Jina keys failed while embedding");
}

export async function embedSermonText(
  sermonId: number,
  title: string,
  text: string
): Promise<number> {
  const stride = 800;
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += stride) {
    chunks.push(text.slice(i, i + 1000));
  }

  const { data: maxRow } = await supabaseAdmin
    .from("documents")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextId = maxRow?.id ? maxRow.id + 1 : 1;

  const batchSize = 10;
  let inserted = 0;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batchTexts = chunks.slice(i, i + batchSize);
    const embeddings = await embedBatch(batchTexts);

    const rows = batchTexts.map((content, j) => ({
      id: nextId++,
      content,
      embedding: embeddings[j],
      category: "sermon",
      source: title,
      reference: null,
      metadata: { sermon_id: sermonId, chunk_index: i + j, ministry_value: "kingdom" },
    }));

    const { error } = await supabaseAdmin.from("documents").insert(rows);
    if (!error) inserted += rows.length;
  }

  return inserted;
}

export async function embedSinglePost(
  postId: number,
  sermonId: number,
  title: string,
  body: string
): Promise<void> {
  const combined = `${title}\n\n${body}`;

  const { data: maxRow } = await supabaseAdmin
    .from("documents")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextId = maxRow?.id ? maxRow.id + 1 : 1;

  const [embedding] = await embedBatch([combined]);

  const { error } = await supabaseAdmin.from("documents").insert({
    id: nextId,
    content: combined,
    embedding,
    category: "sermon_post",
    source: title,
    reference: null,
    metadata: { sermon_id: sermonId, post_id: postId, ministry_value: "kingdom" },
  });

  if (error) throw new Error(`Failed to embed post ${postId}: ${error.message}`);
}
