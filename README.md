# CultureLinter

AI-powered cross-cultural communication assistant. Flags tone and framing mismatches before you hit Send, using Erin Meyer's Culture Map framework via Gemini AI.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Auth | Clerk |
| Database | Neon (Postgres) |
| API | Vercel Serverless Functions (Node 20) |
| AI | Google Gemini 1.5 Flash |
| Deploy | Vercel |

---

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd culture-linter
npm install
```

### 2. Create accounts and get keys

#### Clerk
1. Go to https://clerk.com → create an app
2. Under **API Keys**, copy:
   - `VITE_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_`)
   - `CLERK_SECRET_KEY` (starts with `sk_test_`)

#### Neon (Postgres)
1. Go to https://neon.tech → create a project
2. Copy the **Connection string** (starts with `postgresql://`)
   - The table is auto-created on first request — no migration needed

#### Gemini
1. Go to https://aistudio.google.com/app/apikey
2. Create an API key → copy it

### 3. Set environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...
GEMINI_API_KEY=AIza...
```

### 4. Run locally

```bash
npm run dev
```

Visit http://localhost:5173

> **Note:** API routes need `vercel dev` to run locally (they're serverless functions).
> Install Vercel CLI: `npm i -g vercel` then run `vercel dev` instead of `npm run dev`.

---

## Setting a User's Nationality (Sender Context)

The message linter uses the **logged-in user's nationality** as the sender culture. Set it via Clerk's dashboard:

1. Clerk Dashboard → **Users** → select a user
2. **Metadata** → **Public metadata** → add:
   ```json
   { "nationality": "American" }
   ```

Accepted values match the list in `src/lib/nationalities.js`.

Alternatively, you can add a "Profile" page in the app where users set their own nationality and you call Clerk's `updateUser` API to write to `publicMetadata`.

---

## Deploy to Vercel

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts. Then add environment variables:

```bash
vercel env add VITE_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add DATABASE_URL
vercel env add GEMINI_API_KEY
```

Redeploy:

```bash
vercel --prod
```

### Option B — GitHub + Vercel Dashboard

1. Push this repo to GitHub
2. Go to https://vercel.com → **New Project** → import the repo
3. Add all four environment variables in the **Environment Variables** section
4. Deploy

---

## Project Structure

```
culture-linter/
├── api/
│   ├── _auth.js          # Clerk token verification helper
│   ├── _db.js            # Neon DB connection + table init
│   ├── employees.js      # GET /api/employees, POST /api/employees
│   ├── employees/
│   │   └── [id].js       # PUT /api/employees/:id, DELETE /api/employees/:id
│   └── lint.js           # POST /api/lint (Gemini Culture Map analysis)
├── src/
│   ├── components/
│   │   └── Header.jsx    # Top nav with tab switcher + Clerk UserButton
│   ├── lib/
│   │   └── nationalities.js  # Shared list of nationalities
│   ├── pages/
│   │   ├── EmployeePage.jsx  # Add / edit / delete employees
│   │   └── MessagePage.jsx   # Message drafter + lint results
│   ├── App.jsx           # Root: Clerk SignedIn/SignedOut + tab routing
│   ├── main.jsx          # React entry + ClerkProvider
│   └── index.css         # Tailwind directives
├── .env.example
├── vercel.json
└── README.md
```

---

## How the Culture Map Linting Works

The `/api/lint` endpoint sends the message, sender nationality, and recipient nationality to Gemini 1.5 Flash with a structured prompt grounded in Erin Meyer's **eight cultural dimensions**:

| Dimension | Example contrast |
|-----------|-----------------|
| Communicating | Low-context (American) vs High-context (Japanese) |
| Evaluating | Direct negative feedback (Dutch) vs Indirect (British) |
| Persuading | Applications-first (American) vs Principles-first (French) |
| Leading | Egalitarian (Swedish) vs Hierarchical (Indian) |
| Deciding | Consensual (Japanese) vs Top-down (French) |
| Trusting | Task-based (American) vs Relationship-based (Chinese) |
| Disagreeing | Confrontational (French) vs Avoids confrontation (Thai) |
| Scheduling | Linear-time (German) vs Flexible-time (Saudi) |

The model returns:
- **risk**: `high` / `medium` / `low`
- **flags**: 1–3 dimension-specific issues with suggestions
- **rewrite**: a complete culturally adapted version of the message
