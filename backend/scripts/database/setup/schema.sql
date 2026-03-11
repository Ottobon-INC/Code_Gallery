-- ═══════════════════════════════════════════════════════════════
-- Enterprise Component Hub — PostgreSQL Schema
-- Target: Supabase (or any Postgres ≥ 15 with pgvector)
--
-- Run this file once against your database:
--   psql $DATABASE_URL -f schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ─── Extensions ──────────────────────────────────────────────
-- pgvector: enables the `vector` column type and similarity operators
CREATE EXTENSION IF NOT EXISTS vector;

-- pgcrypto: enables gen_random_uuid() for default UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ─── Users (Custom NextAuth Credentials) ─────────────────────
-- Native user table enabling our manual gatekeeping strategy.
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  is_approved   BOOLEAN     NOT NULL DEFAULT false,     -- Must be set to true by Admin to access hub
  is_admin      BOOLEAN     NOT NULL DEFAULT false,     -- Can approve other users
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─── Components ───────────────────────────────────────────────
-- Core registry of all shared React/TypeScript components.
CREATE TABLE IF NOT EXISTS components (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT        NOT NULL,
  raw_code      TEXT        NOT NULL,                   -- full TypeScript source
  author_id     UUID        NOT NULL,                   -- references your auth users table
  usage_count   INTEGER     NOT NULL DEFAULT 0,         -- incremented by CLI fetch
  likes         INTEGER     NOT NULL DEFAULT 0,
  -- 1536-dim vector produced by text-embedding-ada-002
  embedding     VECTOR(1536),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hierarchical Navigable Small World (HNSW) index for fast, scalable nearest-neighbor search.
-- m=16, ef_construction=64 are solid defaults for 1536-dim OpenAI embeddings.
CREATE INDEX IF NOT EXISTS components_embedding_idx
  ON components
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ─── RPC Component Matching (Semantic Search) ─────────────────
-- A Supabase Remote Procedure Call (RPC) that uses pgvector's <=> operator
-- to calculate cosine distance. (1 - distance = similarity score).
CREATE OR REPLACE FUNCTION match_components(
  query_embedding vector(1536),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  author_id uuid,
  usage_count int,
  likes int,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    components.id,
    components.title,
    components.description,
    components.author_id,
    components.usage_count,
    components.likes,
    components.created_at,
    1 - (components.embedding <=> query_embedding) AS similarity
  FROM components
  WHERE components.embedding IS NOT NULL
  ORDER BY components.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Trigger to auto-update `updated_at` on every row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER components_updated_at
  BEFORE UPDATE ON components
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─── Bounties ─────────────────────────────────────────────────
-- Gamified request board: devs request components they need.
CREATE TABLE IF NOT EXISTS bounties (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT        NOT NULL,
  -- Lifecycle: requested → in-progress → completed
  status        TEXT        NOT NULL DEFAULT 'requested'
                            CHECK (status IN ('requested', 'in-progress', 'completed')),
  requested_by  UUID        NOT NULL,                   -- user who opened the bounty
  claimed_by    UUID,                                   -- user who claimed it (nullable)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER bounties_updated_at
  BEFORE UPDATE ON bounties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─── Telemetry Logs ───────────────────────────────────────────
-- Immutable ledger: every `hub add <component>` CLI invocation is recorded.
-- Drives the ROI/hours-saved analytics dashboard.
CREATE TABLE IF NOT EXISTS telemetry_logs (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id          UUID        NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  user_id               UUID        NOT NULL,
  timestamp             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Estimated developer hours saved by reusing this component instead of building from scratch.
  estimated_hours_saved NUMERIC(5, 2) NOT NULL DEFAULT 0.00
);

-- Index for fast per-component analytics aggregations
CREATE INDEX IF NOT EXISTS telemetry_component_idx ON telemetry_logs (component_id);
-- Index for per-user activity queries
CREATE INDEX IF NOT EXISTS telemetry_user_idx      ON telemetry_logs (user_id);


-- ─── Row Level Security (Supabase) ────────────────────────────
-- Enable RLS so that Supabase auth policies can be applied later.
-- Policies themselves should be added via the Supabase dashboard or
-- additional migration files once your auth strategy is decided.
ALTER TABLE components     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounties       ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_logs ENABLE ROW LEVEL SECURITY;
