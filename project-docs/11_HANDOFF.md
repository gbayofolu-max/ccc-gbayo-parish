# PROJECT HANDOFF — Project Nehemiah

Last Updated: 2026-07-30

> This document is the authoritative executive memory for Project Nehemiah.
>
> Every future ChatGPT session MUST begin from this document.
> Do not restart planning.
> Continue from the latest verified milestone.
> Preserve architectural decisions.
> Append future milestones rather than rewriting history.

---

# Project

## Project Nehemiah

### Vision

Project Nehemiah is a zero-cost, production-quality Digital Ministry Platform that began as the digital platform for CCC Gbayo Parish and is being engineered to evolve into a **multi-tenant SaaS platform** serving churches worldwide from a single codebase.

Each church will eventually have isolated:

- Branding
- Knowledge Base
- AI Assistant
- Documents
- Sermons
- Events
- Announcements
- Media
- Administration

while sharing one scalable architecture.

---

# Engineering Principles

Every engineering decision must satisfy these principles.

- Production-first
- Zero-cost where practical
- Automation-first
- Thin API routes
- Business logic outside routes
- Modular architecture
- Reusable AI services
- AI-first design
- Future multi-tenancy
- Clean repository
- Remove dead code
- Minimize dependencies
- Verify every milestone
- Update documentation after every milestone

---

# Current Architecture

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

Current architecture rules:

- API routes are controllers only.
- AI orchestration belongs inside `src/ai`.
- Components remain reusable.
- No duplicated business logic.
- Documentation must remain synchronized with implementation.

---

# Current AI Flow

Current runtime pipeline:

```
Question
      │
      ▼
Jina Embeddings
      │
      ▼
Supabase Semantic Search
      │
      ▼
Prompt Builder
      │
      ▼
Cerebras
      │
      ▼
Groq Fallback
      │
      ▼
Response
```

Current limitation:

Semantic retrieval currently returns zero matches because the database vectors were generated using an older embedding model.

Current vectors:

```
Xenova/all-MiniLM-L6-v2
```

Runtime embeddings:

```
jina-embeddings-v3
```

A complete database re-embedding is planned.

---

# Verified Milestones

---

## Milestone 0 — Foundation

Completed

Established:

- Permanent project documentation
- Executive memory workflow
- Engineering documentation
- Zero-cost strategy
- Long-term Digital Ministry vision
- Modular AI direction

Created:

- 11_HANDOFF.md
- 12_KNOWN_ISSUES.md
- 13_CHANGELOG.md
- AI Collaboration Protocol

---

## Milestone 0.1 — AI Modularization

Completed

Created:

```
src/ai/

embeddings/
llm/
prompts/
search/
```

Implemented:

- Jina embedding module
- Semantic search module
- Prompt builder
- Cerebras client
- Groq fallback

Business logic removed from API routes.

---

## Milestone 0.2 — Repository Stabilization

Completed

Repository cleanup completed.

Removed:

- unused pages
- unused API routes
- corrupted components
- legacy utilities
- direct OpenAI dependency

Resolved:

- TypeScript issues
- navigation typing
- announcement typing
- pdf typing
- catch handling

Production build restored.

---

## Milestone 0.3 — Production Build

Completed

Modernized:

Supabase browser client.

Migrated to:

```
@supabase/ssr
```

Resolved environment configuration.

Verified:

```
npm run build
```

Passed:

- Compilation
- TypeScript
- Static generation
- Optimization

---

## Milestone 0.4 — AI Rebranding & Runtime Stabilization

Completed

Major architectural rename:

Old assistant:

```
Cele
```

New assistant:

```
Nehemiah
```

Completed:

- API renamed to:

```
/api/nehemiah/query
```

- Frontend page renamed:

```
/nehemiah
```

- Chat component renamed:

```
NehemiahChat
```

- Production build verified
- Runtime pipeline verified
- Jina connectivity verified
- Cerebras integration verified
- Groq fallback verified
- Build stability confirmed

---

# Current Codebase Status

Repository Status:

✅ Production build passes

✅ TypeScript passes

✅ Runtime AI working

✅ Jina connectivity working

✅ Cerebras working

✅ Groq fallback working

✅ Supabase connected

Repository is currently stable.

---

# Current Blocker

Semantic search remains unavailable.

Reason:

Database vectors still use

```
Xenova/all-MiniLM-L6-v2
```

Runtime uses

```
jina-embeddings-v3
```

Therefore semantic similarity cannot work correctly.

No architectural issue exists.

Only data migration remains.

---

# Immediate Next Milestone

## Milestone 0.5 — AI Pipeline Architecture

Objective:

Move all orchestration into reusable AI pipelines.

Planned structure:

```
src/ai/

embeddings/

llm/

pipelines/
    nehemiahPipeline.ts

prompts/

search/
```

Pipeline responsibilities:

- Embedding generation
- Semantic retrieval
- Prompt construction
- LLM selection
- Retry handling
- Provider fallback
- Response formatting

API routes should become only:

```
Receive Request

↓

Call Pipeline

↓

Return Response
```

No orchestration should remain inside route handlers.

---

# Future Milestones

## Milestone 0.6

Deployment

- Vercel deployment
- Production environment validation
- Smoke testing

---

## Milestone 0.7

Knowledge Base Migration

- Re-embed all documents
- Validate semantic retrieval
- Verify search quality

---

## Milestone 1.0

Multi-Tenant Foundation

Introduce tenant isolation for:

- branding
- AI
- documents
- events
- media
- knowledge
- administration

while preserving a single shared codebase.

---

# Long-Term Product Direction

Project Nehemiah is no longer simply a chatbot.

It is becoming an AI-powered Digital Ministry Platform capable of powering churches through modular services including:

- AI ministry assistant
- Sermon knowledge
- Church history
- Bible lessons
- Announcements
- Live streaming
- Document search
- Voice assistant
- WhatsApp integration
- Administrative automation
- Multi-church deployment

---

# Permanent Engineering Rules

Every future engineering task must:

1. Preserve clean architecture.
2. Keep API routes thin.
3. Keep orchestration inside pipelines.
4. Prefer Git Bash operations when practical.
5. Verify with `npm run build`.
6. Update documentation after every completed milestone.
7. Avoid unnecessary dependencies.
8. Preserve production quality.
9. Think ahead for multi-tenancy.
10. Never sacrifice architecture for short-term convenience.

---

# Current Session Summary

Latest verified achievements:

- Repository stabilized.
- AI assistant renamed from Cele to Nehemiah.
- Runtime AI validated.
- Production build successful.
- Jina integration stabilized.
- Cerebras verified.
- Groq fallback operational.
- Architecture prepared for pipeline extraction.

Project is ready to begin **Milestone 0.5 — AI Pipeline Architecture.**

---

**Project Motto**

*"Rebuild. Restore. Strengthen."* — Nehemiah 2:18