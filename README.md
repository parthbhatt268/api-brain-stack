# Brain Stack — API

---

## Project

Today's students don't follow a linear learning path. They constantly consume content across YouTube, Reddit, Instagram, TikTok, GitHub, and countless articles, jumping between AI research, guitar tutorials, and gardening tips. But none of it sticks. It disappears into forgotten bookmarks and saved posts that never get revisited. Students have no visibility into what they are actually building and no clarity on whether they are gravitating toward AI, music, or something else entirely.

Brain Stack gives that scattered learning a home. When something interesting shows up while scrolling, users hit the share button and send it straight to Brain Stack. It handles everything from there: extracting content from videos, posts, or articles, classifying it into the right category, and placing it onto a personal knowledge graph that grows with every save. That graph can be searched at any point, turning random media consumption into a visible career trajectory the student is building on their own terms.

---

## Outcome

**Clarity on direction** — as a student's graph grows, patterns emerge. The categories with the most nodes are the ones they keep coming back to. Brain Stack makes those interests visible, so a student can see their own career trajectory taking shape instead of guessing at it.

**Instant recall through semantic search** — a student can ask a natural language question like _"that video about training neural networks"_ and the app finds the right node using vector similarity, even if the query shares no words with the original content.

**Zero friction to save** — a student shares a URL and walks away. AI handles classification, subcategory, source detection, and summary automatically. The knowledge graph builds itself.

**Secured behind Google** — every node and search is private to the student. Signing in with Google keeps the entire knowledge base protected and persistent across every device.

---

The Express backend for Brain Stack, a personal knowledge graph that lets you save, classify, and semantically search content from across the web.

---

## Tech Stack

| Layer              | Technology                                                              |
| ------------------ | ----------------------------------------------------------------------- |
| Frontend           | React 19, Vite                                                          |
| Canvas / Graph     | @xyflow/react (ReactFlow v12)                                           |
| Icons              | Lucide React, React Icons                                               |
| Backend            | Node.js + Express                                                       |
| Database           | Supabase (PostgreSQL)                                                   |
| Vector search      | pgvector — cosine similarity on 768-dim embeddings                      |
| Embeddings         | Google Gemini `gemini-embedding-001`                                    |
| LLM classification | Google Gemini `gemini-2.5-flash`                                        |
| Auth               | Supabase Auth (Google OAuth) — JWT verified on every request            |
| Content extraction | Mozilla Readability, YouTube InnerTube API, Reddit JSON API, GitHub API |
| Frontend hosting   | Netlify                                                                 |
| Backend hosting    | Render                                                                  |

---

## API Endpoints

### `POST /api/analyse`

Takes a URL, extracts its full content (transcript for YouTube, post text for Reddit, README for GitHub, article body for everything else), and uses Gemini to classify it into a category, subcategory, and 150–200 word summary. Supports YouTube, Reddit, GitHub, LinkedIn, Instagram, TikTok, and general articles.

### `POST /api/embed`

Generates a 768-dimensional vector embedding from a node's summary using Gemini and stores it in the `embedding` column on the node. Called after a node is saved so it becomes semantically searchable.

### `POST /api/search`

Embeds a natural language search query and runs a pgvector cosine similarity search against all stored node embeddings to find the closest matching node. Supports optional category filtering.

### `GET /graph/:userId`

Returns all saved nodes for the authenticated user.

### `POST /graph/:userId`

Saves the user's full node graph (replaces existing nodes) and automatically generates and stores embeddings for every node in one shot.

### `GET /health`

Health check.

All endpoints except `/health` require a valid Supabase JWT (`Authorization: Bearer <token>`).

---

## Highlights

**Semantic search** is the core feature — every node's summary is embedded into a 768-dimensional vector using Gemini and stored in Postgres via pgvector. When a user searches, the query is embedded in the same space and the closest node is found using cosine distance. This means searching for _"that video about training GPT"_ finds the right node even if those exact words never appear in the summary.

**Content extraction** handles each source differently — YouTube transcripts are fetched directly from the InnerTube API (no API key required), Reddit posts via the public JSON API, GitHub repos via the GitHub API (README + description), and all other URLs via Mozilla Readability (the same engine as Firefox Reader Mode).

**Auth** is handled entirely by Supabase. The backend verifies the Supabase JWT on every request and scopes all database operations to the authenticated user. The service role key is used server-side only; row-level security acts as a safety net on the database.

---
