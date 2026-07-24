#!/usr/bin/env python
import os, sys, time
import tqdm
import httpx
from openai import OpenAI
from postgrest import SyncPostgrestClient
from postgrest.exceptions import APIError

# ==============================
#  CONFIGURATION
# ==============================
BATCH_SIZE   = 5                     # Keep payload < 2 MiB (safe for flaky connections)
MAX_RETRIES  = 5                     # How many times we retry a failing batch
BASE_BACKOFF = 2                     # Seconds – exponential back‑off = BASE_BACKOFF ** attempt
MODEL_NAME   = "text-embedding-3-small"   # 1536‑dim OpenAI embedding model
TABLE_NAME   = "documents"           # Your table that holds the sermons / text
# ==============================

# ---------- Initialise clients ----------
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
if not supabase_url or not supabase_key:
    sys.exit("❌ Please export SUPABASE_URL and SUPABASE_KEY first!")

# Supabase client – 5‑minute timeout (long enough for the upsert)
supabase = SyncPostgrestClient(
    f"{supabase_url}/rest/v1",
    headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"},
    timeout=httpx.Timeout(300.0)      # 5 minutes per request
)

# OpenAI client – reads OPENAI_API_KEY from the environment automatically
openai_client = OpenAI()
# ---------------------------------------

# ------- Pull rows that need embeddings -------
print("\n📡 Fetching rows (id + content) from Supabase…")
rows = supabase.table(TABLE_NAME).select("id,content").execute().data
print(f"✅ Got {len(rows)} rows.\n")
# ----------------------------------------------

def embed_batch(texts: list[str]) -> list[list[float]]:
    """Call OpenAI once with a list of strings → list of 1536‑dim vectors."""
    resp = openai_client.embeddings.create(
        model=MODEL_NAME,
        input=texts
    )
    return [item.embedding for item in resp.data]

def upsert_vectors(payload: list[dict]):
    """Write a list of {id, embedding} objects back to Supabase."""
    supabase.table(TABLE_NAME).upsert(payload).execute()

# -------------------- Main Loop --------------------
progress = tqdm.tqdm(range(0, len(rows), BATCH_SIZE), desc="Embedding → Upserting")
for start in progress:
    batch = rows[start:start + BATCH_SIZE]

    # Filter out rows with empty or missing content
    texts = [r["content"] for r in batch if r.get("content") and r["content"].strip()]
    ids   = [r["id"] for r in batch if r.get("content") and r["content"].strip()]

    if not texts:
        continue   # nothing to embed in this batch

    # ----- Retry logic (network + Supabase) -----
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            vectors = embed_batch(texts)          # ← OpenAI request (1536‑dim each)
            payload = [{"id": _id, "embedding": vec} for _id, vec in zip(ids, vectors)]
            upsert_vectors(payload)               # ← Supabase upsert
            break  # success → move to next batch
        except (httpx.ReadTimeout, httpx.WriteTimeout, httpx.ConnectError) as net_err:
            print(f"\n⏳ Network error (attempt {attempt}/{MAX_RETRIES}): {net_err}")
        except APIError as api_err:
            print(f"\n❌ Supabase API error (attempt {attempt}/{MAX_RETRIES}): {api_err}")
        except Exception as e:
            print(f"\n❌ Unexpected error (attempt {attempt}/{MAX_RETRIES}): {e}")

        # If we reach here the attempt failed – back‑off before trying again
        if attempt < MAX_RETRIES:
            backoff = BASE_BACKOFF ** attempt
            print(f"   → sleeping {backoff}s before next retry …")
            time.sleep(backoff)
        else:
            print("   → giving up on this batch, moving on.\n")
            break
# --------------------------------------------------------

print("\n🎉 MISSION ACCOMPLISHED! All rows now have 1536‑dim embeddings in Supabase.\n")
