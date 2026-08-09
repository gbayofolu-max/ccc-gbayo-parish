# KNOWN ISSUES — Project Nehemiah

Last Updated: 2026-07-30

> This document is the permanent engineering issue tracker for Project Nehemiah.
>
> Record every significant engineering issue.
> Never delete investigation history.
> Resolved issues remain documented for future reference.
> Active issues always appear first.

---

# Project Health

Current Status:

🟢 Production Build Stable

Verified:

- ✅ Next.js compilation passes
- ✅ TypeScript passes
- ✅ Static generation passes
- ✅ Production build succeeds
- ✅ Supabase connectivity verified
- ✅ Jina embedding API operational
- ✅ Cerebras integration operational
- ✅ Groq fallback operational
- ✅ Runtime AI operational

Deployment:

Pending.

---

# ACTIVE ISSUES

---

## ISSUE-019

### Title

Legacy Embedding Database

### Status

OPEN

### Severity

Medium

### Impact

Semantic search currently returns zero knowledge matches.

### Investigation

Verified working:

- Jina embedding generation
- Supabase connectivity
- RPC execution
- Runtime AI pipeline

Observed:

```
Matches Found: 0
```

### Root Cause

Database vectors were generated using:

```
Xenova/all-MiniLM-L6-v2
```

Current runtime generates:

```
jina-embeddings-v3
```

Although dimensions are compatible after padding, both models produce embeddings in different semantic spaces.

This is a data migration issue—not an application architecture issue.

### Planned Resolution

Run:

```
scripts/reembed-jina.ts
```

to regenerate every stored embedding using the Jina model.

### Milestone

Scheduled for:

Milestone 0.7 — Knowledge Base Migration

---

# ENGINEERING RISKS

Current architectural risks being monitored.

---

## RISK-001

### AI Pipeline Orchestration

Current Status:

Low Risk

The runtime AI flow still performs orchestration directly from the API route.

This is functional but not aligned with the long-term architecture.

Planned Resolution:

Create:

```
src/ai/pipelines/nehemiahPipeline.ts
```

during Milestone 0.5.

---

## RISK-002

### Production Environment Drift

Current Status:

Low Risk

Development environment has been verified.

Production environment variables still require validation after deployment.

Checklist:

- JINA_API_KEY
- CEREBRAS_KEY_*
- GROQ_KEY_*
- SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

---

# RESOLVED ISSUES

---

## ISSUE-001

AI business logic coupled with API routes.

Resolution:

Created modular AI architecture under:

```
src/ai/
```

Status:

✅ Resolved

---

## ISSUE-002

Semantic search returned zero matches.

Resolution:

Root cause identified as incompatible embedding models.

Migration prepared.

Status:

🟡 Investigation Complete

(Data migration still pending under ISSUE-019.)

---

## ISSUE-003

Corrupted ChatBot component.

Resolution:

Removed unused component.

Status:

✅ Resolved

---

## ISSUE-004

Corrupted Live Stream components.

Resolution:

Removed unused components.

Status:

✅ Resolved

---

## ISSUE-005

Corrupted Calendar component.

Resolution:

Removed.

Status:

✅ Resolved

---

## ISSUE-006

Legacy utility files.

Removed:

- dataLoader.ts
- openaiClient.ts
- prisma.ts

Status:

✅ Resolved

---

## ISSUE-007

Navigation pathname TypeScript issue.

Status:

✅ Resolved

---

## ISSUE-008

Announcement typing mismatch.

Status:

✅ Resolved

---

## ISSUE-009

Dynamic route nullable handling.

Status:

✅ Resolved

---

## ISSUE-010

Unknown catch variable handling.

Status:

✅ Resolved

---

## ISSUE-011

Missing pdf-parse declarations.

Resolution:

Added custom declaration file.

Status:

✅ Resolved

---

## ISSUE-012

Unused legacy pages.

Removed:

- Calendar
- Hymns
- Live Stream

Status:

✅ Resolved

---

## ISSUE-013

Unused API route.

Removed:

```
app/api/verse/cron
```

Status:

✅ Resolved

---

## ISSUE-014

Accidental Git submodule.

Status:

✅ Resolved

---

## ISSUE-015

Legacy OpenAI dependency.

Resolution:

Removed direct dependency.

Remaining OpenAI package is only transitive through LangChain.

Status:

✅ Resolved

---

## ISSUE-016

Supabase browser client migration.

Resolution:

Migrated to:

```
@supabase/ssr
```

Status:

✅ Resolved

---

## ISSUE-017

Missing SUPABASE_URL during production build.

Resolution:

Added required environment variable.

Status:

✅ Resolved

---

## ISSUE-018

Nehemiah rebranding build failures.

Symptoms:

- Missing imports
- Stale `.next` cache
- Broken renamed references

Resolution:

- Renamed API routes
- Renamed frontend routes
- Renamed components
- Cleared `.next`
- Updated imports
- Verified production build

Status:

✅ Resolved

---

# POST-DEPLOYMENT CHECKLIST

Verify after Vercel deployment:

- ☐ Production environment variables
- ☐ Jina connectivity
- ☐ Cerebras connectivity
- ☐ Groq fallback
- ☐ Supabase connection
- ☐ AI pipeline
- ☐ Semantic retrieval
- ☐ Database operations
- ☐ API response times
- ☐ Browser functionality

---

# NEXT ENGINEERING OBJECTIVES

## Milestone 0.5

AI Pipeline Architecture

- Create `src/ai/pipelines/nehemiahPipeline.ts`
- Move orchestration out of API routes
- Centralize retries and fallbacks
- Standardize AI workflow

---

## Milestone 0.6

Deployment

- Deploy to Vercel
- Verify production environment
- Smoke test production build

---

## Milestone 0.7

Knowledge Base Migration

- Re-embed all vectors with Jina
- Restore semantic retrieval
- Validate search quality

---

# Engineering Rule

An issue is considered resolved only after:

1. Root cause identified.
2. Permanent fix implemented.
3. `npm run build` passes.
4. Runtime verified.
5. Documentation updated.