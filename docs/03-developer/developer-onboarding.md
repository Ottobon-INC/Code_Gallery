# Developer Onboarding Guide

**Platform:** Ottobon Enterprise Component Hub  
**Estimated Setup Time:** ~20 minutes  
**Last Updated:** 2026-03-06  

---

## Prerequisites

Before you clone the repository, ensure the following are installed on your machine:

| Tool | Minimum Version | Check Command | Purpose |
|------|:--------------:|---------------|---------|
| **Node.js** | 20.x LTS | `node --version` | Runtime for API and frontend |
| **npm** | 10.x | `npm --version` | Package management per app |
| **Git** | 2.40+ | `git --version` | Source control |
| **VS Code** (recommended) | Latest | — | IDE with TypeScript support |

> [!IMPORTANT]
> This monorepo does **not** use a global workspace manager (no Turborepo, no pnpm workspaces). Each app under `apps/` has its own `node_modules`. You must `npm install` in each app directory separately.

---

## 1. Clone the Repository

```bash
git clone https://github.com/your-org/Code_Components.git
cd Code_Components
```

---

## 2. Configure the API (`apps/api`)

The API reads all secrets from a `.env` file at runtime.

```bash
cd apps/api
cp .env.example .env
```

Now open `apps/api/.env` and fill in every value:

| Variable | Required | Description |
|----------|:--------:|-------------|
| `DATABASE_URL` | ✓ | Supabase connection string. Format: `postgresql://user:password@host:port/database` |
| `OPENAI_API_KEY` | ✓ | OpenAI API key for `text-embedding-ada-002`. Required for semantic search and component creation |
| `SUPABASE_URL` | ✓ | Your Supabase project URL. e.g. `https://xxxxxxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | ✓ | Service-role key from Supabase Dashboard → Settings → API → Secret Keys. **Never expose this to the browser.** |
| `PORT` | ✗ | API port. Defaults to `3000` |
| `NODE_ENV` | ✗ | `development` locally, `production` in deployments |

> [!CAUTION]
> Never commit `.env` to git. The `.gitignore` at root excludes it, but double-check with `git status` before every commit.

---

## 3. Configure the Frontend (`apps/web`)

```bash
cd apps/web
cp .env.example .env
```

| Variable | Required | Description |
|----------|:--------:|-------------|
| `NEXT_PUBLIC_API_URL` | ✓ | URL of the running API. Locally: `http://localhost:3000` |
| `NEXTAUTH_URL` | ✓ | Full URL of the frontend. Locally: `http://localhost:3001` |
| `NEXTAUTH_SECRET` | ✓ | Random 32+ char string. Generate with: `openssl rand -base64 32` |

---

## 4. Set Up the Database

> [!NOTE]
> If you are connecting to a shared Supabase instance, skip schema setup — it's already applied. Only run these if starting fresh.

Run the initial schema (creates all tables, pgvector index, RPC function):

```bash
cd Code_Components
# You need psql or access via Supabase Dashboard SQL Editor
psql $DATABASE_URL -f scripts/database/setup/schema.sql
```

Apply any pending migrations in order:

```bash
node scripts/database/migrations/migrate-categories-table.js
node scripts/database/migrations/migrate-category.js
node scripts/database/migrations/migrate-stack.js
node scripts/database/migrations/migrate-likes.js
node scripts/database/migrations/migrate-user-name.js
node scripts/database/migrations/migrate-image-url.js
```

Create your first admin user:

```bash
node scripts/database/admin/create-user.js
```

---

## 5. Install Dependencies

Each app manages its own dependencies:

```bash
# API
cd apps/api
npm install

# Frontend
cd apps/web
npm install

# CLI (optional)
cd apps/cli
npm install
```

---

## 6. Start the Development Servers

Open **two terminals** simultaneously:

**Terminal 1 — API**
```bash
cd apps/api
npm run dev
# → 🚀 Listening on http://localhost:3000
```

**Terminal 2 — Frontend**
```bash
cd apps/web
npm run dev
# → Ready on http://localhost:3001
```

Navigate to `http://localhost:3001`. Register an account, then use the Supabase Table Editor to set `is_approved = true` on your user row.

---

## 7. Supabase Storage Setup

The image upload feature requires a public storage bucket:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → **Storage**
2. Click **New bucket** → name: `component-images` → set to **Public**
3. Confirm `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set in `apps/api/.env`

---

## 8. Verify Your Setup

| Check | Expected Result |
|-------|----------------|
| `GET http://localhost:3000/health` | `{ "status": "ok", "timestamp": "..." }` |
| Frontend at `localhost:3001` | Login page renders |
| Login with created user | Redirects to dashboard |
| Component list loads | Shows 0 or more components (no API error banner) |
| Create a component | Embedding generation succeeds, card appears |

---

## 9. Common Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `ERR_CONNECTION_REFUSED` on port 3000 | API not running | `cd apps/api && npm run dev` |
| `column image_url does not exist` | Migration not applied | Run `node scripts/database/migrations/migrate-image-url.js` |
| `Account pending approval` after login | `is_approved` still false | Set `is_approved = true` via Supabase Table Editor |
| Semantic search returns no results | Component has no embedding | Embedding is generated on `POST /api/components`. Re-create the component. |
| `SUPABASE_SERVICE_KEY is not set` warning in API logs | Missing env var | Add to `apps/api/.env` |
