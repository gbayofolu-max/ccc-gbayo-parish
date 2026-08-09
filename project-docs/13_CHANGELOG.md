# CHANGELOG — Project Nehemiah

Last Updated: 2026-07-30

> Permanent engineering history for Project Nehemiah.
>
> This document records **verified** architectural, engineering, dependency,
> and production changes.
>
> Never rewrite history.
> Never delete completed milestones.
> Append new milestones chronologically.

---

# Project Timeline

---

# Milestone 0 — Foundation

**Date**

2026-07-27

## Added

- Permanent project documentation system.
- Executive project memory.
- Engineering issue tracker.
- Permanent changelog.
- AI Collaboration Protocol.

Created:

```
project-docs/
├── 11_HANDOFF.md
├── 12_KNOWN_ISSUES.md
├── 13_CHANGELOG.md
└── AI Collaboration Protocol
```

## Architecture

Established core engineering principles:

- Thin API routes
- Modular AI
- Reusable services
- Clean repository
- Zero-cost strategy
- Production-first development

## Vision

Approved Project Nehemiah as a future **multi-tenant Digital Ministry Platform** capable of serving multiple churches from one shared codebase.

---

# Milestone 0.1 — AI Modularization

**Date**

2026-07-27

## Added

Created AI module structure:

```
src/ai/

├── embeddings/
├── llm/
├── prompts/
└── search/
```

Implemented:

- Jina embedding module
- Supabase semantic search
- Prompt builder
- Cerebras LLM integration
- Groq fallback integration

## Changed

Refactored AI business logic into reusable modules.

Reduced API routes to thin request controllers.

## Investigated

Semantic search returning zero matches.

Verified:

- Jina API
- Supabase RPC
- Database connectivity

Root cause identified:

Database vectors were created using:

```
Xenova/all-MiniLM-L6-v2
```

Current runtime uses:

```
jina-embeddings-v3
```

Prepared:

```
scripts/reembed-jina.ts
```

---

# Milestone 0.2 — Repository Stabilization

**Date**

2026-07-28

## Removed

Unused pages:

- Calendar
- Hymns
- Live Stream

Unused API routes:

- verse/cron

Unused components:

- ChatBot
- Calendar
- LiveStreamPlayer
- LiveStreamSchedule
- LiveStreamSection

Legacy utilities:

- dataLoader
- openaiClient
- prisma

## Fixed

Resolved:

- Announcement typing
- NavLink typing
- useParams handling
- Unknown catch variables
- pdf-parse declarations

## Dependency Cleanup

Removed direct OpenAI dependency.

Confirmed remaining OpenAI package exists only through LangChain.

## Verified

Production repository successfully cleaned.

---

# Milestone 0.3 — Production Build Stabilization

**Date**

2026-07-29

## Changed

Migrated browser Supabase client.

Previous:

```
@supabase/auth-helpers-nextjs
```

Current:

```
@supabase/ssr
```

## Fixed

Environment variable mismatch during production build.

Added:

```
SUPABASE_URL
```

## Verified

Successfully completed:

```
npm run build
```

Verified:

- Next.js compilation
- TypeScript
- Static generation
- Route generation
- Production optimization

Repository declared production-build stable.

---

# Milestone 0.4 — AI Rebranding & Runtime Stabilization

**Date**

2026-07-30

## Renamed

AI Assistant:

```
Cele
```

↓

```
Nehemiah
```

API:

```
/api/cele/query
```

↓

```
/api/nehemiah/query
```

Frontend page:

```
/cele
```

↓

```
/nehemiah
```

Component:

```
CeleChat
```

↓

```
NehemiahChat
```

## Improved

Verified runtime AI execution.

Verified:

- Jina connectivity
- Cerebras responses
- Groq fallback
- Runtime pipeline
- Production build after rename

Resolved stale build cache by clearing:

```
.next/
```

## Architecture

Confirmed future AI orchestration will move into:

```
src/ai/pipelines/
```

rather than remaining inside API routes.

This preserves the thin-controller architecture.

---

# Current Architecture Snapshot

```
src/

ai/
    embeddings/
    llm/
    prompts/
    search/

components/

data/

lib/
```

Current runtime:

```
Question
      │
      ▼
Jina Embeddings
      │
      ▼
Semantic Search
      │
      ▼
Prompt Builder
      │
      ▼
Cerebras
      │
      ▼
Groq
      │
      ▼
Response
```

---

# Current Project Status

Repository:

✅ Stable

Production Build:

✅ Passing

TypeScript:

✅ Passing

Runtime AI:

✅ Operational

Semantic Retrieval:

⚠ Awaiting Jina database re-embedding.

---

# Upcoming Milestones

## Milestone 0.5

AI Pipeline Architecture

Goals:

- Introduce `src/ai/pipelines/`
- Move orchestration out of API routes
- Centralize retries
- Centralize provider fallback
- Standardize AI workflows

---

## Milestone 0.6

Deployment

- Deploy to Vercel
- Validate production environment
- Smoke test deployment

---

## Milestone 0.7

Knowledge Base Migration

- Re-embed all documents with Jina
- Restore semantic retrieval
- Validate search quality

---

## Milestone 1.0

Multi-Tenant Foundation

Introduce tenant isolation for:

- Branding
- AI
- Documents
- Knowledge
- Events
- Media
- Administration

while preserving one scalable production codebase.

---

# Documentation Rule

Every completed milestone must conclude with:

1. Build verification (`npm run build`)
2. Runtime verification
3. Documentation updates
4. Git commit

Documentation is considered part of the production codebase.