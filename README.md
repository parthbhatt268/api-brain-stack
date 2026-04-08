# api-brain-stack

Express backend for Brain Stack. Verifies Supabase JWTs from the React frontend and manages user node graphs.

## Setup

```bash
cp .env.example .env
# fill in your values
npm install
npm run dev
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| GET | /graph/:userId | Fetch all nodes for a user |
| POST | /graph/:userId | Upsert (replace) all nodes for a user |

All `/graph` routes require an `Authorization: Bearer <supabase-jwt>` header. The JWT's `sub` must match `:userId`, otherwise a 403 is returned.

## Database

Run the following SQL in your Supabase project's SQL editor:

```sql
CREATE TABLE nodes (
  id            TEXT        NOT NULL,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url           TEXT,
  category      TEXT,
  subcategory   TEXT,
  summary       TEXT,
  datetime      TIMESTAMPTZ,
  origin        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, user_id)
);

-- Enable Row Level Security
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;

-- Per-user policy: users can only read/write their own rows
CREATE POLICY "Users access own nodes"
  ON nodes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

> **Note:** The backend uses the service role key and bypasses RLS by design. RLS is a safety net for any direct client-side access — keep the service role key server-side only.
