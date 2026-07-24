#!/usr/bin/env python
"""
reembed_key_rotation.py   (also used as reembed_openai_key_fallback.py)

* Pulls only rows where `embedding` IS NULL.
* Cycles through the environment variables OPENAI_KEY_1 … OPENAI_KEY_7.
* If a key returns a 429 (quota exhausted) it automatically switches to the next key.
* Upserts the 1536‑dim OpenAI embeddings back into the `documents` table.
"""

import os, sys, time, itertools, tqdm
from supabase import create_client, Client
from openai import OpenAI, OpenAIError

# ----------------------------------------------------------------------
# 1️⃣ Load required env vars
# ----------------------------------------------------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    sys.stderr.write("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n")
    sys.exit(1)

# Gather all OPENAI_KEY_n variables (ignore empties)
openai_keys = [os.getenv(f"OPENAI_KEY_{i}") for i in range(1, 8)]
openai_keys = [k for k in openai_keys if k]
if not openai_keys:
    sys.stderr.write("❌ No OPENAI_KEY_n variables found.\n")
    sys.exit(1)

# ----------------------------------------------------------------------
# 2️⃣ Initialise Supabase client (sync version is fine for batch jobs)
# ----------------------------------------------------------------------
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

TABLE_NAME = "documents"

# ----------------------------------------------------------------------
# 3️⃣ Fetch ONLY rows that are missing an embedding
# ----------------------------------------------------------------------
rows = (
    supabase.table(TABLE_NAME)
    .select("id,content")
    .is_("embedding", "null")   # <-- THIS LINE ENSURES we only embed NULL vectors
    .execute()
    .data
)

if not rows:
    print("✅ No rows with NULL embeddings – nothing to do.")
    sys.exit(0)

print(f"📡 Fetched {len(rows)} rows that need embeddings…")

# ----------------------------------------------------------------------
# 4️⃣ Helper: build an OpenAI client for a specific key
# ----------------------------------------------------------------------
def get_client(key: str) -> OpenAI:
    return OpenAI(api_key=key)

# ----------------------------------------------------------------------
# 5️⃣ Batch‑process → embed → upsert
# ----------------------------------------------------------------------
BATCH_SIZE = 200
upserts = []

# Create an infinite cycle over (index, key) tuples – we’ll break when a batch succeeds
key_cycle = itertools.cycle(enumerate(openai_keys, start=1))

for start in tqdm.tqdm(range(0, len(rows), BATCH_SIZE), desc="Embedding → Upserting"):
    batch = rows[start : start + BATCH_SIZE]
    texts = [r["content"] for r in batch]

    # --------------------------------------------------------------
    # Try each key until we get a successful response for this batch
    # --------------------------------------------------------------
    for key_idx, key in key_cycle:
        client = get_client(key)
        try:
            # OpenAI embedding model – 1536‑dimensional
            resp = client.embeddings.create(
                model="text-embedding-3-small",
                input=texts,
            )
            # `resp.data` is a list of objects with an `embedding` attribute
            embeddings = [e.embedding for e in resp.data]
            print(f"✅  Key {key_idx}/{len(openai_keys)} succeeded.")
            break   # success → exit the key‑loop for this batch
        except OpenAIError as exc:
            # 429 = quota exhausted – move to the next key
            if getattr(exc, "status_code", None) == 429:
                print(f"⚠️  Key {key_idx}/{len(openai_keys)} exhausted – trying next key…")
                continue
            # Any other error = temporary glitch – retry the same key after a short back‑off
            print(f"❌ Unexpected error with key {key_idx}: {exc!r}")
            time.sleep(5)
            continue

    # --------------------------------------------------------------
    # Upsert the vectors back into Supabase
    # --------------------------------------------------------------
    for row, vec in zip(batch, embeddings):
        upserts.append({"id": row["id"], "embedding": vec})

    if len(upserts) >= BATCH_SIZE:
        supabase.table(TABLE_NAME).upsert(upserts, on_conflict="id").execute()
        upserts.clear()

# Flush any leftovers
if upserts:
    supabase.table(TABLE_NAME).upsert(upserts, on_conflict="id").execute()

print("🚀  MISSION ACCOMPLISHED")