export async function createEmbedding(
  text: string
): Promise<number[]> {
  const JINA_KEY = process.env.JINA_API_KEY;

  if (!JINA_KEY) {
    throw new Error("JINA_API_KEY missing in .env.local");
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
    const errorText = await response.text();

    throw new Error(
      `Jina API Error (${response.status}): ${errorText.substring(
        0,
        300
      )}`
    );
  }

  const json = await response.json();

  if (!json?.data?.[0]?.embedding) {
    throw new Error("Jina returned invalid embedding.");
  }

  const embedding =
    json.data[0].embedding as number[];

  // Maintain Supabase vector dimension compatibility
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
