#!/usr/bin/env python
"""
local_embed_384.py

* Pulls only rows where `embedding` is NULL.
* Generates a 384‑dim embedding with a tiny Sentence‑Transformers model.
* Pads the vector to 1536 dimensions (the size of the `vector` column in Supabase).
* Upserts the vectors back into the `documents` table.

No OpenAI keys are used – everything runs locally on CPU.
"""

import os
import sys
import tqdm
import numpy as np
from supabase import create_client, Client
from sentence_transformers import SentenceTransformer

# --------------------------------------------------------------
# 1️⃣  Load required environment variables
# --------------------------------------------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")   # we exported this earlier
if not SUPABASE_URL or not SUPABASE_KEY:
    sys.stderr.write("❌ SUPABASE_URL or SUPABASE_KEY not set in the environment.\n")
    sys.exit(1)

# --------------------------------------------------------------
# 2️⃣  Initialise the Supabase client (sync client is fine for batch jobs)
# --------------------------------------------------------------
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --------------------------------------------------------------
# 3️⃣  Load the lightweight transformer model (CPU‑only)
# --------------------------------------------------------------
# all‑MiniLM‑L6‑v2 → 384‑dim embeddings, ~25 MB download, fast on CPU
model = SentenceTransformer("all-MiniLM-L6-v2")

# --------------------------------------------------------------
# 4️⃣  Fetch only rows that are missing an embedding
# --------------------------------------------------------------
TABLE_NAME = "documents"

rows = (
    supabase.table(TABLE_NAME)
    .select("id,content")
    .is_("embedding", "null")   # <-- only NULL vectors
    .execute()
    .data
)

if not rows:
    print("✅ No rows with NULL embeddings – nothing to do.")
    sys.exit(0)

print(f"📡 Fetched {len(rows)} rows (id + content) from Supabase…")

# --------------------------------------------------------------
# 5️⃣  Helper: pad a 384‑dim vector up to 1536 dim (zero‑padding)
# --------------------------------------------------------------
def pad_to_1536(vec: list[float]) -> list[float]:
    # OpenAI embeddings are 1536‑dim; pgvector column expects that length.
    # Pad with zeros so the column accepts the vector.
    return vec + [0.0] * (1536 - len(vec))

# --------------------------------------------------------------
# 6️⃣  Batch‑process → embed → upsert
# --------------------------------------------------------------
BATCH_SIZE = 200           # same batch size the OpenAI script used
upserts = []

for start in tqdm.tqdm(range(0, len(rows), BATCH_SIZE), desc="Embedding → Upserting"):
    batch = rows[start : start + BATCH_SIZE]

    # 6a – texts to embed
    texts = [row["content"] for row in batch]

    # 6b – 384‑dim embeddings (list of list[float])
    embeddings_384 = model.encode(texts, show_progress_bar=False).tolist()

    # 6c – pad each embedding to 1536 dim
    embeddings_1536 = [pad_to_1536(vec) for vec in embeddings_384]

    # 6d – prepare upsert payloads
    for row, vec in zip(batch, embeddings_1536):
        upserts.append({"id": row["id"], "embedding": vec})

    # 6e – when a full batch is ready, send to Supabase
    if len(upserts) >= BATCH_SIZE:
        supabase.table(TABLE_NAME).upsert(upserts, on_conflict="id").execute()
        upserts.clear()

# Flush any leftovers
if upserts:
    supabase.table(TABLE_NAME).upsert(upserts, on_conflict="id").execute()

print("🚀  MISSION ACCOMPLISHED")
