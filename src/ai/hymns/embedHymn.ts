const JINA_KEYS: string[] = [];

if (process.env.JINA_API_KEY) {
  JINA_KEYS.push(process.env.JINA_API_KEY);
}

for (let i = 2; i <= 10; i++) {
  const key =
    process.env[`JINA_KEY_${i}`] ||
    process.env[`JINA_API_KEY_${i}`];

  if (key) {
    JINA_KEYS.push(key);
  }
}

if (JINA_KEYS.length === 0) {
  throw new Error("No Jina API keys configured");
}

let currentKeyIndex = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pad1536(vec: number[]): number[] {
  const padded = new Array(1536).fill(0);

  for (let i = 0; i < vec.length && i < 1536; i++) {
    padded[i] = vec[i];
  }

  return padded;
}

/**
 * Generate the same type of embedding used by the canonical
 * 398-hymn re-embedding process.
 *
 * The embedding represents the exact combined Yoruba + English
 * hymn content supplied by the caller.
 */
export async function embedHymn(
  content: string
): Promise<number[]> {
  const maxCycles = 2;

  for (let cycle = 0; cycle < maxCycles; cycle++) {
    for (let attempt = 0; attempt < JINA_KEYS.length; attempt++) {
      const key = JINA_KEYS[currentKeyIndex];

      try {
        const res = await fetch("https://api.jina.ai/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "jina-embeddings-v3",
            input: [content],
          }),
        });

        if (res.ok) {
          const json = await res.json();

          if (!json.data || json.data.length !== 1) {
            throw new Error(
              `Jina returned ${json.data?.length ?? 0} embeddings for 1 text`
            );
          }

          const vector = pad1536(json.data[0].embedding as number[]);

          if (vector.length !== 1536) {
            throw new Error(
              `Invalid hymn embedding: expected 1536 dimensions, got ${vector.length}`
            );
          }

          return vector;
        }

        const body = await res.text();

        console.error(
          `Jina key ${currentKeyIndex + 1} failed: HTTP ${res.status} ${body.slice(
            0,
            200
          )}`
        );
      } catch (error) {
        console.error(
          `Jina key ${currentKeyIndex + 1} error:`,
          error instanceof Error ? error.message : String(error)
        );
      }

      currentKeyIndex =
        (currentKeyIndex + 1) % JINA_KEYS.length;
    }

    await sleep(5000);
  }

  throw new Error("All Jina keys failed while embedding hymn");
}
