# Monorepo Directory Structure

**Platform:** Ottobon Enterprise Component Hub  
**Last Updated:** 2026-03-06  

> This document is the **authoritative map** of the codebase. When adding a new file, consult this document first to determine where it belongs.

---

## Root Level

```
Code_Components/               ← Monorepo root (no business logic here)
├── apps/                      ← Deployable application runtimes
├── scripts/                   ← Operational scripts (not deployed)
├── docs/                      ← This documentation suite
├── .github/                   ← GitHub Actions workflows + PR templates
├── .gitignore                 ← Global git ignore rules
├── package.json               ← Thin root orchestrator (no dependencies)
└── README.md                  ← Project overview and quick start
```

**Rule:** The root `package.json` contains **only** `scripts` that delegate to apps. It has zero `dependencies`. Any business logic found at root level is architectural debt.

---

## `apps/api` — Express REST API

```
apps/api/
├── src/
│   ├── server.ts              ← Entry point. Calls createApp(), binds port, registers SIGTERM/SIGINT handlers
│   ├── app.ts                 ← App factory. Registers all middleware and routes. Import this for tests.
│   │
│   ├── config/
│   │   ├── db.ts              ← Singleton pg.Pool. Exports query<T>() and pool. ONLY place DB is configured.
│   │   └── openai.ts          ← OpenAI client singleton. Used by embedding service.
│   │
│   ├── routes/
│   │   ├── auth/
│   │   │   └── index.ts       ← POST /api/auth/login, POST /api/auth/register
│   │   ├── components/
│   │   │   ├── crud.ts        ← GET /api/components (list), GET /api/components/:id, POST /api/components
│   │   │   └── search.ts      ← POST /api/components/search (pgvector semantic search)
│   │   ├── categories/
│   │   │   └── index.ts       ← GET /api/categories, POST /api/categories
│   │   ├── cli/
│   │   │   └── fetch.ts       ← GET /api/cli/fetch (inject code + log telemetry)
│   │   └── upload.ts          ← POST /api/upload (base64 → Supabase Storage)
│   │
│   ├── services/
│   │   └── embeddingService.ts ← Calls OpenAI to generate 1536-dim vector from component description
│   │
│   ├── lib/
│   │   └── (shared utilities) ← e.g. error formatters, pagination helpers
│   │
│   └── types/
│       └── (custom TypeScript interfaces) ← Shared request/response types used across routes
│
├── public/
│   └── uploads/               ← Legacy local upload fallback (superseded by Supabase Storage)
├── tests/                     ← Jest + Supertest integration tests
├── .env                       ← Local secrets (gitignored)
├── .env.example               ← Template for required env vars
├── jest.config.js             ← Jest config pointing to tests/
├── tsconfig.json              ← TypeScript config: strict: true, target: ES2022
└── package.json               ← API-specific dependencies and scripts
```

### Where New API Code Goes

| What you're adding | Where it goes |
|--------------------|---------------|
| New REST endpoint | `src/routes/<domain>/index.ts` |
| Business logic / external API call | `src/services/<name>.ts` |
| Shared type/interface | `src/types/<name>.ts` |
| Reusable utility function | `src/lib/<name>.ts` |
| New environment variable | `src/config/<domain>.ts` + document in `docs/03-developer/developer-onboarding.md` |

---

## `apps/web` — Next.js 14 Frontend

```
apps/web/
├── src/
│   ├── app/                   ← Next.js App Router (all routes are folders here)
│   │   ├── layout.tsx         ← Root layout: fonts, global providers, SessionProvider
│   │   ├── page.tsx           ← Dashboard: component browser (/)
│   │   ├── login/
│   │   │   └── page.tsx       ← /login — unauthenticated entry point
│   │   ├── register/
│   │   │   └── page.tsx       ← /register — creates account with is_approved=false
│   │   ├── pending-approval/
│   │   │   └── page.tsx       ← /pending-approval — shown to registered but unapproved users
│   │   ├── admin/
│   │   │   └── page.tsx       ← /admin — admin-only user management (guarded by middleware)
│   │   ├── analytics/
│   │   │   └── page.tsx       ← /analytics — telemetry dashboard, hours saved
│   │   ├── bounty-board/
│   │   │   └── page.tsx       ← /bounty-board — component request board
│   │   └── api/
│   │       └── auth/[...nextauth]/
│   │           └── route.ts   ← NextAuth.js API route handler
│   │
│   ├── components/            ← Reusable React components (no page-level logic)
│   │   ├── ComponentCard.tsx  ← Card for displaying a component in the grid
│   │   ├── NewComponentModal.tsx ← Modal for creating a new component with image upload
│   │   ├── Sidebar.tsx        ← Left navigation with category links
│   │   └── (others...)
│   │
│   ├── lib/
│   │   └── auth.ts            ← NextAuth configuration (providers, callbacks, JWT strategy)
│   │
│   ├── types/
│   │   ├── index.ts           ← Core types: Component, User, Category, Bounty
│   │   └── next-auth.d.ts     ← NextAuth session type augmentation (adds is_approved, is_admin)
│   │
│   └── middleware.ts          ← Edge middleware: auth guard, approval redirect, admin guard
│
├── public/                    ← Static assets served at /
├── .env                       ← Local frontend secrets (gitignored)
├── .env.example               ← Template for NEXT_PUBLIC_API_URL, NEXTAUTH_URL, NEXTAUTH_SECRET
├── next.config.ts             ← Next.js config
├── tsconfig.json              ← TypeScript config
└── package.json               ← Frontend dependencies and scripts
```

### Where New Frontend Code Goes

| What you're adding | Where it goes |
|--------------------|---------------|
| New page/route | `src/app/<route-name>/page.tsx` |
| Reusable UI component | `src/components/<ComponentName>.tsx` |
| API call helper / data fetcher | `src/lib/<domain>.ts` |
| TypeScript interface | `src/types/index.ts` |
| NextAuth type extension | `src/types/next-auth.d.ts` |

---

## `apps/cli` — Hub CLI Tool

```
apps/cli/
├── src/                       ← CLI source code
├── package.json               ← CLI dependencies and bin entry
└── tsconfig.json
```

Used via `hub add <component-id>` — fetches raw code from `GET /api/cli/fetch` and writes it to the local project.

---

## `scripts/database` — Operational DB Scripts

```
scripts/
└── database/
    ├── migrations/            ← Sequential schema change scripts (run in order, once)
    │   ├── migrate-categories-table.js
    │   ├── migrate-category.js
    │   ├── migrate-stack.js
    │   ├── migrate-likes.js
    │   ├── migrate-user-name.js
    │   ├── migrate-image-url.js
    │   └── add-image-url.sql
    │
    ├── setup/                 ← One-time initial database setup
    │   ├── schema.sql         ← Full schema: tables, indexes, RPC functions, triggers
    │   ├── setup-db.js        ← Creates users table (legacy helper)
    │   └── setup-rls.js       ← Applies Row Level Security policies
    │
    └── admin/                 ← Manual operator utilities (NOT automated)
        ├── create-user.js     ← Creates a user directly in DB (bypass registration)
        ├── register-admin.js  ← Sets is_admin=true on an existing user
        └── seed-components.js ← Seeds sample component data for development
```

> [!IMPORTANT]
> Migration scripts must be run **in order** and **exactly once** per environment. They are not idempotent unless explicitly noted. Before running any migration in production, test it against a staging database first.

---

## `docs` — Documentation Suite

```
docs/
├── 01-product/
│   └── prd.md
├── 02-architecture/
│   ├── system-architecture.md
│   └── database-schema.md
├── 03-developer/
│   ├── developer-onboarding.md
│   ├── directory-structure.md   ← This file
│   └── coding-guidelines.md
├── 04-devops/
│   ├── ci-cd-pipeline.md
│   └── runbooks.md
└── 05-quality/
    └── testing-strategy.md
```
