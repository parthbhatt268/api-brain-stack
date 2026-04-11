-- Brain Stack — database setup
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: every statement uses IF NOT EXISTS / OR REPLACE.

-- ─────────────────────────────────────────────
-- 1. TABLES
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS nodes (
  id          text        PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category    text        NOT NULL,
  subcategory text,
  source      text        NOT NULL,   -- "youtube"|"github"|"instagram"|"tiktok"|"reddit"|"linkedin"|"article"
  url         text        NOT NULL,
  summary     text        NOT NULL,
  datetime    timestamptz NOT NULL DEFAULT now(),
  origin      text        NOT NULL DEFAULT 'added',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  color      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS graph_positions (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  view_mode  text NOT NULL,   -- "subcategory" | "timeline" | "platform"
  positions  jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, view_mode)
);

-- ─────────────────────────────────────────────
-- 2. ROW-LEVEL SECURITY — nodes
-- ─────────────────────────────────────────────

ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select own" ON nodes;
DROP POLICY IF EXISTS "insert own" ON nodes;
DROP POLICY IF EXISTS "update own" ON nodes;
DROP POLICY IF EXISTS "delete own" ON nodes;

CREATE POLICY "select own" ON nodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own" ON nodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own" ON nodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own" ON nodes FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 3. ROW-LEVEL SECURITY — categories
-- ─────────────────────────────────────────────

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select own" ON categories;
DROP POLICY IF EXISTS "insert own" ON categories;
DROP POLICY IF EXISTS "update own" ON categories;
DROP POLICY IF EXISTS "delete own" ON categories;

CREATE POLICY "select own" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own" ON categories FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 4. ROW-LEVEL SECURITY — graph_positions
-- ─────────────────────────────────────────────

ALTER TABLE graph_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select own" ON graph_positions;
DROP POLICY IF EXISTS "insert own" ON graph_positions;
DROP POLICY IF EXISTS "update own" ON graph_positions;
DROP POLICY IF EXISTS "delete own" ON graph_positions;

CREATE POLICY "select own" ON graph_positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own" ON graph_positions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own" ON graph_positions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own" ON graph_positions FOR DELETE USING (auth.uid() = user_id);
