# StudyMate AI

A full-stack MERN application that lets students upload their notes and ask
questions about them in plain English. Answers are generated with a
Retrieval-Augmented Generation (RAG) pipeline built on top of the Gemini API,
so responses are grounded in the student's own material instead of the
model's general knowledge.

## What it does

1. A student signs up, logs in, and gets a JWT.
2. They paste in a set of notes with a title. The backend splits the text
   into overlapping chunks and computes an embedding for each chunk.
3. When they ask a question, the backend embeds the question, finds the most
   relevant chunks by cosine similarity, and sends those chunks plus the
   question to Gemini's chat completion API (via its OpenAI-compatible endpoint) to generate a grounded answer.
4. The conversation (question, answer, and the source chunks used) is saved
   so the student can see their chat history per document.

## Architecture

```
backend (Node.js + Express) — one process, one URL
   |-- serves the built React app (frontend/dist) as static files
   |-- /api/auth        register / login (bcrypt + JWT)
   |-- /api/documents    upload notes -> chunk -> embed -> store
   |-- /api/chat         ask a question -> retrieve -> generate answer
   |-- /api/stats        usage/traffic totals -> admin dashboard (x-admin-key)
   |
   |-- MongoDB (Mongoose) - users, documents (with embedded chunks), chat history, visits
   |-- Gemini API          - gemini-embedding-001, gemini-2.5-flash
```

The frontend and backend deploy together as a single service (see
"Deploying it for real" below) — there's only one host to stand up, and the
frontend talks to the API with a plain relative `/api` path since they share
an origin. You can still split them onto separate hosts later (e.g. put the
frontend on Vercel for a CDN) — `frontend/vercel.json` is kept around for
that, and `VITE_API_BASE_URL` overrides the relative path if you do.

If `GEMINI_API_KEY` isn't set, the backend falls back to a deterministic
local embedding and a canned "offline mode" answer, so the app still runs
end-to-end without a live key (useful for local dev and for the automated
tests).

## Tech stack

- **Frontend:** React 18, Vite, plain CSS (no framework)
- **Backend:** Node.js, Express, Mongoose (MongoDB), JWT auth (jsonwebtoken + bcryptjs)
- **AI:** Google Gemini API via its OpenAI-compatible endpoint (embeddings + chat completions), hand-rolled RAG (chunking + cosine similarity)
- **Testing:** Jest + Supertest (backend), in-memory model mocks for CI-friendly tests
- **Deployment:** Render (single service — API + built frontend), MongoDB Atlas (database)

## Running it locally

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm run dev             # starts on http://localhost:5000
npm test                 # runs the Jest/Supertest suite
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env    # set VITE_API_BASE_URL if backend isn't on localhost:5000
npm run dev              # starts on http://localhost:5173
```

Open the frontend URL, sign up, upload some notes, and start asking
questions.

## How to use it

1. **Landing page**: visitors land on a plain-English overview of what the
   app does before they sign up.
2. **Sign up / log in** from the "Get started" button.
3. **Upload notes**: give them a title and paste the text in. You'll see a
   confirmation with how many chunks it was split into.
4. **Chat**: pick the document from the dropdown and ask a question. The
   answer streams back with the source chunks it was grounded in, and the
   conversation is saved so you can scroll back through it.

## Traffic & usage dashboard

Every request is logged (path, method, timestamp) to a `visits` collection
by a small non-blocking middleware in `backend/src/app.js` — it never awaits
the write and never fails a real request if logging fails.

`GET /api/stats` returns totals (users, documents, questions, visits), a
7-day daily visit breakdown, and new-user count for the last 7 days. It's
protected by an `x-admin-key` header, checked against `ADMIN_KEY` (falls
back to `JWT_SECRET` if `ADMIN_KEY` isn't set).

The frontend's `/admin` route (e.g. `https://your-app.onrender.com/admin`)
is a small dashboard that prompts for that key and renders the numbers — no
separate deploy needed, it's part of the same build the API serves.

## Deploying it for real

Three things, one deploy target:

1. **MongoDB Atlas** - create a free cluster, get the connection string.
2. **Google Gemini** - grab a free API key at aistudio.google.com/apikey (optional at first — the app runs in
   offline-fallback mode without one).
3. **Render** - connect this repo. It picks up the root-level `render.yaml`,
   which builds the frontend, installs the backend, and starts one web
   service that serves both. Set `MONGO_URI`, `JWT_SECRET`,
   `GEMINI_API_KEY`, and optionally `ADMIN_KEY` in the Render dashboard's
   environment variables (they're intentionally left out of the repo).

Push to GitHub first (`git remote add origin <your repo> && git push -u
origin main`), then connect that repo in Render. One URL comes out the
other end and serves the whole app. See `StudyMate-AI-Simple-Deploy-Guide.docx`
for exact click-by-click steps.

## Project structure

```
studymate-ai/
  render.yaml        single-service Render blueprint (builds frontend + backend)
  backend/
    src/
      models/       Mongoose schemas (User, Document, ChatMessage, Visit)
      routes/        auth, documents, chat, stats
      services/      openaiService (embeddings + chat), vectorStore (chunking + similarity)
      middleware/    JWT auth guard
      app.js          Express app — API routes + serves frontend/dist in production
    tests/           Jest/Supertest integration tests + in-memory model mocks
  frontend/
    src/
      components/    Landing, Auth, Upload, Chat, AdminStats
      api.js          fetch wrapper for the backend REST API
    vercel.json       optional — only needed if you split the frontend out later
  README.md
```
