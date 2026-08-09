# PROJECT MEMORY (Latest)

## Project

Project Nehemiah

Primary Goal:
Build a zero-cost, production-quality Digital Ministry Platform for CCC Gbayo Parish that can later become a multi-tenant church platform for other parishes.

--------------------------------------------------

## Development Principles

- Zero-cost wherever possible
- Automation first
- Clean architecture
- Production-ready code
- Modern UI/UX
- No unnecessary dependencies
- Keep project tree clean
- Modular architecture
- Reusable AI components
- Everything documented

--------------------------------------------------

## Current Architecture Direction

Move AI into

src/
    ai/
        embeddings/
        llm/
        prompts/
        search/

Keep API routes thin.

Business logic belongs inside src/ai.

--------------------------------------------------

## Current Status

✓ Next.js running

✓ Supabase connected

✓ Environment variables detected

✓ Cerebras key rotation working

✓ Groq fallback working

✓ Backup of original Cele route created

app/api/cele/query/route.backup.txt

✓ Test route working

✓ Project documentation created

project-docs/

--------------------------------------------------

## Current Blocker

Cele AI currently uses LOCAL embeddings.

We are migrating to

Jina Embeddings API

Reason

- Faster

- Better semantic search

- No transformer downloads

- Smaller server memory usage

- Faster deployment

--------------------------------------------------

## Immediate Next Tasks

1.
Create

src/ai/embeddings/jina.ts

2.

Move embedding logic there.

3.

Test

Question

↓

Jina

↓

Supabase RPC

↓

Returned matches

4.

Restore full

app/api/cele/query/route.ts

using modular architecture.

5.

Connect

CeleChat.tsx

6.

Test complete pipeline.

--------------------------------------------------

## Project Cleanup

Completed

✓ duplicate livestream page removed

✓ project-docs created

✓ architecture planned

Pending

empty files

app/calendar/page.tsx

app/hymns/page.tsx

app/api/verse/cron/route.ts

Need inspection before deletion.

--------------------------------------------------

## Images

Keep

logo.png

hero-bg.jpg

oshoffa.jpg

rev-gbayo.jpg

angel-icon.png

These are actively referenced.

--------------------------------------------------

## AI Design

Question

↓

Jina Embedding

↓

Supabase Vector Search

↓

Relevant Sermons

↓

Cerebras

↓

Groq fallback

↓

Pastor Gbayo response

--------------------------------------------------

## Long-Term Roadmap

Phase 1

Foundation

Phase 2

Cele AI

Phase 3

Automation

Phase 4

Media

Phase 5

Member Portal

Phase 6

Administration

Phase 7

Project Nehemiah Platform

--------------------------------------------------

## Commercial Vision

One codebase

Multiple churches

Every church receives

church_id

logo

branding

history

AI knowledge

documents

livestream

events

Everything isolated.

Footer

Powered by CCC Gbayo Parish

--------------------------------------------------

## Future Revenue

Installation

Hosting

AI

Support

Training

Premium features

Digital archives

Church dashboards

--------------------------------------------------

## Working Style

The assistant should

- Prefer Git Bash commands.

- Clearly label responses as

ACTION

or

EXPLANATION.

- Keep responses concise.

- Ask for file contents instead of guessing.

- Avoid unnecessary testing.

- Build foundation before features.

- Keep project documentation updated continuously.

--------------------------------------------------

## First Task In Next Chat

Continue with

Jina Embedding implementation.

Do not restart planning.

Continue from this point.
# Checkpoint — Project Nehemiah
Date: 2026-07-27

## Current Stage

Project foundation completed.

Completed:
- Documentation system established.
- Project Memory established.
- AI architecture agreed.
- Zero-cost architecture confirmed.
- Automation-first development adopted.
- Ministry Platform vision approved.
- "Powered by CCC Gbayo Parish" branding approved.
- Duplicate Live Stream page removed.
- AI folders created:
  src/ai/
      embeddings/
      llm/
      prompts/
      search/
- src/lib/automation created.

Environment verified:
- Supabase ✔
- Jina ✔
- Cerebras ✔
- Groq ✔

Current AI Status:
- app/api/chat/route.ts contains the complete working AI.
- app/api/cele/query/route.ts is still the temporary testing route.
- Final route has NOT yet been restored.

Current Priority:

1. Replace local embedding with Jina
2. Test Jina → Supabase
3. Modularize AI
4. Restore final Cele route
5. Connect frontend
6. Continue Ministry Platform

Known Issues:

- calendar/page.tsx empty
- hymns/page.tsx empty
- verse/cron/route.ts empty

Several unused files were discovered corrupted (NULL-byte files). These will be rebuilt only if needed.

Long-term Vision:

Develop Project Nehemiah into a multi-parish Digital Ministry Platform where each church owns its own AI knowledge base while being powered by the CCC Gbayo Parish platform.
Project Nehemiah Memory Checkpoint

Completed:

✅ src/ai/embeddings/jina.ts created
✅ Jina Embedding API migrated from old route logic
✅ src/ai/search/search.ts created
✅ Supabase vector search modularized
✅ src/ai/llm/cerebras.ts created
✅ Cerebras key rotation logic modularized
✅ src/ai/llm/groq.ts created
✅ Groq fallback logic modularized
✅ src/ai/prompts/systemPrompt.ts created
✅ AI architecture foundation completed

Current stage:

Next task: Restore final Cele AI API route
# Checkpoint — Project Nehemiah
Date: 2026-07-27

## AI Modularization Completed

Completed:

✓ src/ai/embeddings/jina.ts
  - Jina Embedding API isolated.

✓ src/ai/search/search.ts
  - Supabase vector search isolated.

✓ src/ai/llm/cerebras.ts
  - Cerebras key rotation isolated.

✓ src/ai/llm/groq.ts
  - Groq fallback isolated.

✓ src/ai/prompts/systemPrompt.ts
  - Pastor Gbayo system prompt isolated.

Architecture now follows:

API Route
    ↓
Embeddings
    ↓
Vector Search
    ↓
Prompt Builder
    ↓
Cerebras
    ↓
Groq Fallback

Business logic has been removed from the API layer.

Current Route Status:

app/api/cele/query/route.ts

is still the temporary environment test route.

Next Milestone:

Restore the final Cele AI API route using the modular AI components.
route.ts
    │
    ├── createEmbedding()
    ├── searchDocuments()
    ├── createSystemPrompt()
    ├── askCerebras()
    └── askGroq()
    Phase 2

Implement the POST() logic and run an end-to-end test:

Question
   ↓
Jina
   ↓
Supabase
   ↓
Cerebras
   ↓
Groq (fallback)
   ↓
JSON response

This phased approach makes it much easier to identify any integration issues.

ACTION — Next session

The next command I recommend will be to begin rebuilding:

app/api/cele/query/route.ts

using the modular architecture.

We'll proceed incrementally rather than replacing all 359 lines at once. That gives us a clean checkpoint after each stage and makes debugging much simpler if something doesn't compile.
Checkpoint — 2026-07-27

✓ AI modules compile successfully.
✓ route.ts converted into a thin controller.
✓ First integration complete:
    route.ts
        ↓
    createEmbedding()

✓ Next.js compiles with the new architecture.

Current milestone:
Ready to integrate Supabase vector search.

Next objective:
Question
    ↓
Jina Embedding
    ↓
Supabase Vector Search
ACTION — Next Step: Connect Supabase Search
Checkpoint — 2026-07-27

✓ End-to-end API pipeline verified.

Working pipeline:

Question
    ↓
route.ts
    ↓
Jina Embedding
    ↓
Supabase RPC

Result:
Pipeline executes successfully without runtime errors.

Current blocker:
Semantic search returns zero matches.

Next task:
Inspect the match_documents RPC and verify the stored embeddings and search parameters before integrating the LLM.
Checkpoint — 2026-07-27

Semantic search investigation complete.

Root cause identified:

Existing Supabase vectors were generated using:
Xenova/all-MiniLM-L6-v2 (384 dimensions)

Current query vectors use:
Jina jina-embeddings-v3

Action required:
Re-embed documents using Jina before AI search testing.

Next:
Create Jina migration script.
Project Nehemiah — Checkpoint

✅ AI architecture created
✅ Jina embedding module created
✅ Supabase search module created
✅ Cerebras module created
✅ Groq module created
✅ System prompt module created
✅ route.ts modular controller started
✅ Jina → Supabase search pipeline tested

Current finding:
Old Supabase document vectors were created with:

Xenova/all-MiniLM-L6-v2
384 dimensions padded to 1536

Current system uses:

Jina jina-embeddings-v3

Result:
Search returns 0 matches because vector spaces differ.

Created:
scripts/reembed-jina.ts

Status:
⏳ Waiting to verify document count
⏳ Waiting to run Jina re-embedding migration
Project Nehemiah AI Integration Checkpoint

Project: ccc-gbayo-parish
Feature: CCC Knowledge AI Assistant (/api/cele/query)
Current Phase: RAG pipeline wiring (Embedding → Vector Search → LLM)

1. LLM Providers Status
Groq

File:

src/ai/llm/groq.ts

Current implementation:

Uses Groq OpenAI-compatible endpoint:
https://api.groq.com/openai/v1/chat/completions
Model:
llama-3.1-8b-instant
Key rotation implemented:
GROQ_KEY_1
GROQ_KEY_2
GROQ_KEY_3
GROQ_KEY_4
GROQ_KEY_5
GROQ_KEY_6

Status:
✅ Code structure correct
✅ Multiple key fallback implemented
⚠️ Not yet connected into final response generation

Cerebras

File:

src/ai/llm/cerebras.ts

Current implementation:

Endpoint:

https://api.cerebras.ai/v1/chat/completions

Model:

llama3.1-8b

Key rotation:

CEREBRAS_KEY_1
CEREBRAS_KEY_2
CEREBRAS_KEY_3
CEREBRAS_KEY_4
CEREBRAS_KEY_5
CEREBRAS_KEY_6

Status:

✅ Code structure correct
✅ Multiple key fallback implemented
⚠️ Not yet connected into final answer generation

2. API Controller Status

File:

app/api/cele/query/route.ts

Current imports:

createEmbedding
searchDocuments
createSystemPrompt
askCerebras
askGroq

Pipeline progress:

Completed:
Question reception

Working:

{
"question":"Who is Jesus Christ?"
}

returns:

{
"success":true,
"question":"Who is Jesus Christ?"
}
Jina Embedding

Working.

Test result:

embeddingDimensions:1536

Meaning:

✅ Jina embedding generation works
✅ Dimension matches Supabase vector size

Supabase Vector Search

Working technically.

Test:

matchesFound:0

Meaning:

The API reached Supabase successfully, but semantic matching returned nothing.

3. Root Cause Found

The problem was NOT Groq.

The problem was NOT Cerebras.

The problem was:

Existing database embeddings were incompatible.

Evidence:

Old script:

scripts/reembed.ts

used:

Xenova/all-MiniLM-L6-v2

which creates:

384 dimensions

then padded to:

1536 dimensions

This creates fake vectors.

The new script:

scripts/reembed-jina.ts

uses:

jina-embeddings-v3

and writes:

1536 dimensions

proper embeddings.

4. Current Running Process

Command:

npx tsx scripts/reembed-jina.ts

Result:

Found 1000 documents

Processing successfully.

Example:

Processing document 2101
Completed 2101
...
Processing document 2638
Completed 2638

Status:

✅ Working
✅ No errors
✅ Supabase updates successful

Current job:

Rebuilding document vectors.

5. Important Observation

The reembedding script updates:

documents.embedding

but does NOT change:

content
metadata
categories
IDs

Safe operation.

6. When We Continue

Next steps:

Step 1

Allow:

scripts/reembed-jina.ts

to finish.

Then test:

curl -X POST http://localhost:3000/api/cele/query \
-H "Content-Type: application/json" \
-d "{\"question\":\"Who is Pastor Gbayo?\"}"

Expected improvement:

Before:

matchesFound:0

After:

matchesFound: >0
Step 2

Connect retrieved documents into:

createSystemPrompt()

Example flow:

User Question
      |
      v
Jina Embedding
      |
      v
Supabase Vector Search
      |
      v
Relevant CCC Documents
      |
      v
System Prompt
      |
      v
Cerebras / Groq
      |
      v
Final Answer
Step 3

Implement AI fallback:

Preferred:

1. Cerebras
2. Groq
3. return graceful error

because both already have key rotation.

Current Project Health
Component	Status
Next.js API route	✅ Working
Environment variables	✅ Loaded
Jina API	✅ Working
Supabase connection	✅ Working
Vector search function	✅ Working
Database embeddings	🔄 Rebuilding
Cerebras	✅ Ready
Groq	✅ Ready
Final AI response	⏳ Pending

Before shutting down, if battery allows, do not interrupt the reembedding process. It has already passed hundreds of records successfully. If the laptop dies, we will check whether partial updates remain and modify the script to resume from unfinished records if needed.

When we continue, we resume exactly from:

"Finish Jina reembedding → test matchesFound → connect Cerebras/Groq answer generation."
 # PROJECT NEHEMIAH — COMPLETE RECAP

**Session Date:** 2026-07-31  
**Status:** Milestone 0.5 Complete → Phase 4 Complete

---

## What We Started With

You brought a build report and two files:
- `NehemiahChat.tsx` (broken, 6 problems)
- Project context (Project Nehemiah, AI-powered Digital Ministry Platform)

**Known Issue at Start:** Semantic search returned `0 matches` because database vectors were built with `Xenova/all-MiniLM-L6-v2` while the runtime used `jina-embeddings-v3`.

---

## What We Fixed (Chronological)

### 1. NehemiahChat.tsx — 6 Critical Fixes
| # | Problem | Fix |
|---|---------|-----|
| 1 | `</div>` closed too early | Moved after messages + loading block |
| 2 | `key={index}` anti-pattern | Added `id: string` with `crypto.randomUUID()` |
| 3 | No auto-scroll | Added `bottomRef` + `scrollIntoView` effect |
| 4 | Click-outside listener re-attached every render | Guarded with `if (!isOpen) return` |
| 5 | Undifferentiated errors | Added console logging + `TypeError` network detection |
| 6 | Input not disabled while loading | Added `disabled={loading}` + styles |

**Result:** Build passed. Production build verified: `✓ Compiled successfully`, 20/20 pages generated.

---

### 2. Database Re-embedding (3085 Documents)
- Confirmed Supabase `documents.embedding` column = `vector(1536)`
- Ran `scripts/reembed-jina.ts`
- **3085 Bible verses re-embedded** with `jina-embeddings-v3` + zero-padded to 1536 dimensions
- Runtime semantic search architecture confirmed working

---

### 3. Knowledge Base Ingestion (208 New Chunks)
**Discovery:** `documents` table only contained Bible verses. Sermons, lessons, and legacy documents existed as PDFs in `public/` but were never ingested.

**PDFs Found:**
| File | Folder | Chunks | Category |
|------|--------|--------|----------|
| `constitution.pdf` | legacy | 175 | Legacy |
| `our-legacy-and-constitution.pdf` | legacy | 15 | Legacy |
| `bible-lesson.pdf` | lessons | 9 | Lesson |
| `slide1.pdf` | sermons | 2 | Sermon |
| `slide2.pdf` | sermons | 1 | Sermon |
| `slide3.pdf` | sermons | 2 | Sermon |
| `slide4.pdf` | sermons | 4 | Sermon |

**Script Fixes Applied (`scripts/ingest-pdfs.ts`):**
- Replaced Ollama/nomic-embed-text with **Jina v3**
- Added **1536-dimension padding** to match Supabase column
- Switched from broken `pdf-parse` to working **`pdf-parse-fork`**
- Fixed **ESM/CJS import hell** using `createRequire`
- Fixed **chunking stride bug** (`i += 800` instead of broken overlap)
- Fixed **primary key collision** (Supabase `id` is `bigint`, not UUID — used incremental numeric IDs)
- Added **batch embedding** (32 chunks per API call)
- Replaced fragile content-match delete with **source-path-based cleanup**

**Result:** 208 chunks successfully inserted. Nehemiah now has access to sermons, lessons, and legacy documents.

---

### 4. Dev Server Issue Identified
- `npm run dev` (Turbopack) returned **404 on `/api/nehemiah/query`** with 3.8min compile time
- **Root cause:** Turbopack on-demand compilation failure, not missing code
- **Verification:** `npm run build` passes cleanly, route exists in output
- **Workaround:** Use `npm start` (production server) or `npx next dev --turbo=false`

---

## Current Architecture Status

```
src/ai/
├── embeddings/jina.ts      ✅ Jina v3, 1024d → pad1536()
├── search/search.ts        ✅ Supabase semantic search
├── prompts/systemPrompt.ts ✅
├── llm/cerebras.ts         ✅
├── llm/groq.ts             ✅ Fallback
└── pipelines/              ✅ Orchestration extracted from routes

src/components/
└── NehemiahChat.tsx        ✅ Conversation UI, Markdown, auto-scroll

Database:
├── 3085 Bible verses       ✅ Re-embedded with Jina v3
├── 208 PDF chunks          ✅ Ingested (sermons, lessons, legacy)
└── match_documents RPC     ✅ Multiple versions exist (may need cleanup)
```

---

## Tasks Ahead (Immediate → Long-Term)

### Immediate (Next 1–2 Sessions)
1. **Test semantic retrieval** — Ask Nehemiah about sermon content ("Tell me about true worship") using `npm start` to confirm the knowledge layer works end-to-end
2. **Clean up `match_documents` RPC** — You have **6 versions** of the function in Supabase. Delete the stale ones and keep only the version your pipeline actually calls
3. **Fix Turbopack or document workaround** — Either resolve the 404 in dev mode or standardize on `--turbo=false` for local development
4. **Update documentation** — `11_HANDOFF.md`, `12_KNOWN_ISSUES.md`, `13_CHANGELOG.md` for Milestone 0.5 completion

### Short-Term (Milestone 0.6–0.7)
5. **Observability (Phase 5)** — Add structured logging, response timings, embedding/LLM latency tracking
6. **Production Deployment (Phase 6)** — Deploy to Vercel, smoke test, runtime validation
7. **Re-embed remaining tables** — If sermons/lessons/history eventually move to dedicated tables, apply the same Jina re-embedding pattern

### Medium-Term (Milestone 1.0)
8. **Multi-tenant foundation** — Tenant isolation for branding, AI, documents, knowledge
9. **Admin dashboard** — AI knowledge management, document upload, embedding status
10. **Member portal** — Authentication, personalized experience

### Long-Term (Vision)
11. **Module expansion** — Events, live streaming, voice assistant, WhatsApp integration, church media
12. **Multi-church SaaS** — One codebase, thousands of churches, isolated identities

---

## Known Issues to Document
- **Turbopack dev mode:** `/api/nehemiah/query` returns 404 in `next dev` (Turbopack). Production build and `npm start` work correctly.
- **Supabase RPC pollution:** 6 versions of `match_documents` exist — potential confusion for which function the pipeline calls.
- **PDF parser dependency:** `pdf-parse` (original) is broken in ESM; `pdf-parse-fork` works but generates warnings on malformed PDFs.

---

## Files Modified in This Session
- `src/components/NehemiahChat.tsx` — Complete rewrite (6 fixes)
- `scripts/ingest-pdfs.ts` — Complete rewrite (Jina v3, batching, bigint IDs, pdf-parse-fork)
- `scripts/reembed-jina.ts` — Ran successfully (no code changes needed)
- `.next/` — Cleared multiple times

---

**Recommendation:** Run `npm start`, test Nehemiah with a sermon query, confirm semantic retrieval works, then commit everything and update your three project docs (`11_HANDOFF.md`, `12_KNOWN_ISSUES.md`, `13_CHANGELOG.md`).