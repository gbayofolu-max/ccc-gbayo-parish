interface SearchOptions {
  matchThreshold?: number;
  matchCount?: number;
  filterCategory?: string | null;
}

export async function searchDocuments(
  embedding: number[],
  options: SearchOptions = {}
) {
  const SUPABASE_URL =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const SUPABASE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing."
    );
  }

  const {
    matchThreshold = 0.5,
    matchCount = 5,
    filterCategory = null,
  } = options;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/match_documents`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query_embedding: embedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_category: filterCategory,
      }),
    }
  );

  const body = await response.text();

  if (!response.ok) {
    throw new Error(
      `Supabase Error (${response.status}): ${body.substring(
        0,
        300
      )}`
    );
  }

  const matches = JSON.parse(body);

  return Array.isArray(matches)
    ? matches
    : [];
}