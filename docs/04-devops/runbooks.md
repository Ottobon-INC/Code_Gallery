# Operational Runbooks

**Platform:** Ottobon Enterprise Component Hub  
**Audience:** Platform Engineers, On-Call Engineers  
**Last Updated:** 2026-03-06  

> Each runbook follows the **Symptoms → Diagnosis → Fix → Verify** structure.

---

## Runbook 1 — API is Unreachable (Port 3000)

### Symptoms
- Frontend shows: `"Could not reach the API. Is the backend running on port 3000?"`
- `curl http://localhost:3000/health` returns `ERR_CONNECTION_REFUSED`
- All component list, search, and upload operations fail

### Diagnosis

```bash
# Check if the process is alive
netstat -ano | findstr :3000      # Windows
lsof -i :3000                    # macOS/Linux

# Check nodemon/ts-node logs
cd apps/api && npm run dev
# Look for TSError or startup crash messages
```

Common causes and what to look for in the logs:

| Log Message | Cause |
|-------------|-------|
| `TSError: Unable to compile TypeScript` | TypeScript compilation error in a source file |
| `Cannot find module 'X'` | Package not installed — run `npm install` |
| `DATABASE_URL environment variable is not set` | `.env` file missing or not loaded |
| `[nodemon] app crashed - waiting for file changes` | One of the above; check the error above this line |

### Fix

```bash
cd apps/api
npm install            # ensure all dependencies are installed
npm run dev            # restart the server
```

If a TypeScript error is the cause, identify and fix it before the server will start.

### Verify
```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

## Runbook 2 — Database Query Failing (`column X does not exist`)

### Symptoms
- API logs show: `error: column c.image_url does not exist` (or similar)
- Component list returns 500 errors to the frontend
- `[components] List error:` appears repeatedly in API console

### Diagnosis

This is always a **missing database migration**. The code references a column that hasn't been added to the table yet.

Compare the column name in the error against the migration history in `docs/02-architecture/database-schema.md`.

### Fix

```bash
cd Code_Components

# Find the correct migration
node scripts/database/migrations/migrate-image-url.js    # for image_url
node scripts/database/migrations/migrate-category.js     # for category
node scripts/database/migrations/migrate-stack.js        # for stack
# etc.
```

Alternatively, apply directly via Supabase SQL Editor:
```sql
ALTER TABLE components ADD COLUMN IF NOT EXISTS image_url TEXT;
```

### Verify
```bash
curl http://localhost:3000/api/components
# Expected: { "success": true, "data": [...] }
```

---

## Runbook 3 — Image Uploads Failing

### Symptoms
- Submitting a component with an image shows an error in the modal
- API logs show: `[upload] Supabase storage error: ...`
- `image_url` remains `null` in the database after component creation

### Diagnosis

```bash
# 1. Check SUPABASE_URL and SUPABASE_SERVICE_KEY are set
grep SUPABASE apps/api/.env

# 2. Check the API log output for the exact error
# Common errors:
# "Bucket not found"          → Bucket doesn't exist in Supabase Storage
# "Invalid API Key"           → SUPABASE_SERVICE_KEY is wrong or anon key used instead
# "Image upload not configured" → Env vars missing entirely
```

### Fix

**Bucket missing:**
1. Go to Supabase Dashboard → Storage
2. Create bucket named `component-images`, set to **Public**

**Wrong API key:**
1. Go to Supabase Dashboard → Settings → API → Secret Keys
2. Copy the `service_role` key (not the `anon`/publishable key)
3. Update `SUPABASE_SERVICE_KEY` in `apps/api/.env`
4. Restart the API server

### Verify
```bash
# Test upload directly
curl -X POST http://localhost:3000/api/upload \
  -H "Content-Type: application/json" \
  -d '{"data":"iVBORw0KGgo=","mimeType":"image/png"}'
# Expected: {"success":true,"data":{"url":"https://....supabase.co/..."}}
```

---

## Runbook 4 — Semantic Search Returns No Results

### Symptoms
- Searching returns 0 results even for component titles that clearly exist
- Components appear in the browse list but not in search

### Diagnosis

```sql
-- Run in Supabase SQL Editor
SELECT id, title, embedding IS NOT NULL AS has_embedding
FROM components;
```

If `has_embedding` is `false` for all rows, embeddings were never generated.

### Fix

Embeddings are generated automatically when a component is created via `POST /api/components`. They are NOT retroactively generated for existing components.

**Option A:** Re-create existing components (nuclear, not recommended for production data).  

**Option B:** Write a one-time backfill script:

```javascript
// scripts/database/admin/backfill-embeddings.js (create this)
// For each component with embedding IS NULL:
//   1. Call OpenAI text-embedding-ada-002 with description
//   2. UPDATE components SET embedding = $1 WHERE id = $2
```

**Check the OpenAI key is working:**
```bash
grep OPENAI_API_KEY apps/api/.env
# Should be sk-... (not sk-...)
```

### Verify
- Create a new test component
- Search for a term from its description
- Confirm the component appears in results with a similarity score

---

## Runbook 5 — Rolling Back a Bad Deployment

### Symptoms
- A merge to `main` caused a regression or production outage
- Reverting is required

### Steps

```bash
# 1. Identify the last known good commit
git log --oneline -10

# 2. Create a revert PR (preferred — keeps history clean)
git revert <bad-commit-sha>
git push origin revert/<description>
# Open a PR, get emergency approval, merge

# 3. OR hard reset (only if no one has branched from bad commit)
git checkout main
git reset --hard <last-good-sha>
git push --force-with-lease origin main
```

> [!CAUTION]
> `git push --force-with-lease` rewrites public history. Only use this if no one has pulled the bad commit. Always prefer `git revert` in a collaborative environment.

### Verify
- Confirm the health endpoint returns 200
- Smoke test: browse components, login, search

---

## Runbook 6 — Manually Running a DB Migration in Production

### Pre-Flight Checklist

- [ ] Migration has been tested on a local/staging DB first
- [ ] You have read the migration script and understand every SQL statement
- [ ] You have a database backup or can restore from Supabase point-in-time recovery

### Steps

```bash
# Option A: Run the Node.js migration script
DATABASE_URL="<production-url>" node scripts/database/migrations/migrate-image-url.js

# Option B: Apply SQL directly via psql
psql $DATABASE_URL -c "ALTER TABLE components ADD COLUMN IF NOT EXISTS image_url TEXT;"

# Option C: Supabase SQL Editor (safest for production)
# Paste the SQL, review it, click Run
```

### Verify
```bash
# Check the column exists
psql $DATABASE_URL -c "\d components"
# Or via Supabase Table Editor → components table → Definition tab
```
