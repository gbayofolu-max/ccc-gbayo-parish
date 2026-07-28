import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function embedText(text: string): Promise<number[]> {
  const JINA_KEY = process.env.JINA_API_KEY;

  if (!JINA_KEY) {
    throw new Error("JINA_API_KEY missing.");
  }

  const response = await fetch(
    "https://api.jina.ai/v1/embeddings",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${JINA_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "jina-embeddings-v3",
        input: text,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Jina error: ${await response.text()}`
    );
  }

  const json = await response.json();

  const embedding =
    json.data[0].embedding as number[];

  const padded = new Array(1536).fill(0);

  for (
    let i = 0;
    i < embedding.length && i < 1536;
    i++
  ) {
    padded[i] = embedding[i];
  }

  return padded;
}


async function reembedAll() {

  const { data: docs, error } =
    await supabase
      .from("documents")
      .select("id, content");


  if (error) {
    console.error(
      "Fetch failed:",
      error
    );
    return;
  }


  console.log(
    `Found ${docs?.length ?? 0} documents`
  );


  for (const doc of docs ?? []) {

    console.log(
      `Processing document ${doc.id}`
    );


    const embedding =
      await embedText(doc.content);


    const { error: updateError } =
      await supabase
        .from("documents")
        .update({
          embedding,
        })
        .eq(
          "id",
          doc.id
        );


    if (updateError) {

      console.error(
        `Failed ${doc.id}:`,
        updateError
      );

    } else {

      console.log(
        `Completed ${doc.id}`
      );

    }
  }


  console.log(
    "Jina re-embedding complete."
  );
}


reembedAll()
  .catch(console.error);
