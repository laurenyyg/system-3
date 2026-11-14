# System 3

*System 1 thinks fast. System 2 thinks slow. System 3 challenges how you think.*

System 3 is a Gemini-powered decision-thinking companion for high-stakes decisions under uncertainty. It guides users through **Share → Understand → Challenge → Explore → Reflect** without deciding for them, separating user-provided facts, assumptions, model hypotheses, and questions needing verification.

## Features

- **Five-stage progress tracker:** Navigate freely and edit earlier inputs; downstream AI outputs are marked stale when upstream inputs change.
- **Challenge Your Thinking:** Evidence-grounded blind spot hypotheses and Lollapalooza interacting-pressure loops.
- **Explore:**
  - **Choose Your Lenses:** 5 personalized decision lenses (3 recommended) with trackable verification checklists.
  - **Rehearse the Future:** Positive, premortem, and mixed hypothetical scenarios across at least two paths.
- **Reflect:** Editable Decision Record with deterministic Markdown export (Copy / Download `.md`) and a local future-self email draft.
- **Privacy-conscious:** No database or authentication; local browser persistence is opt-in (*Save on this device*). `GEMINI_API_KEY` stays strictly server-side.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` (never commit this file):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-3.6-flash
   ```
3. Run the Vite frontend + local API server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173`.

## Railway Deployment (Single Service)

1. Connect this repository to a new Railway service (or deploy with Railway CLI).
2. Set the **Build Command** and **Start Command** (Railway auto-detects `package.json` scripts):
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
3. Configure **Environment Variables** in Railway:
   - `GEMINI_API_KEY` — *(Required)* Your Google Gemini API key.
   - `GEMINI_MODEL` — *(Optional, defaults to `gemini-3.6-flash`)*
   - `PORT` — Provided automatically by Railway; `server/prod.ts` binds to `0.0.0.0:$PORT`.
4. **Persistent decision-start counter (optional):** Attach a **Railway Volume** to the service with mount path `/data`. Railway automatically injects `RAILWAY_VOLUME_MOUNT_PATH`, so `/api/decision-starts` persists the aggregate start count across deployments without an external database.
5. **Healthcheck path (optional):** `/health` returns `200 {"ok":true,"service":"system-3"}` without calling Gemini.
