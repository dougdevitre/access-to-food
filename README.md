# Access To Food

> A community platform connecting people with food resources in the St. Louis area — pantry locators, distribution events, SNAP guidance, an AI food-access assistant, and tools for volunteers and pantry staff. Part of the Access To initiative.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Live site:** https://food.cotrackpro.com

## Features

- **Pantry directory & map** — browse partner food pantries with live inventory status, backed by Firestore
- **Distribution events** — upcoming mobile markets, pop-up pantries, and drive-thru distributions
- **AI Assistant** — a Claude-powered chat assistant that can search the pantry database to answer "where can I get food near me?"
- **Inventory Scanner** — pantry staff photograph shelves and Claude vision estimates stock levels by category
- **SNAP eligibility guide** — quick income-based eligibility estimate and application resources
- **Volunteer & donate** — shift signups and donation information
- **Sort the Shift** — a volunteer-training game: sort donations into the right bins, flag spoiled items, post your meals-provided score to a leaderboard
- **Command Center dashboard** — at-a-glance pantry status, staffing, and risk overview

## Architecture

- **Frontend:** Vite + React 19 + TypeScript + Tailwind CSS 4, a single-page app served statically by Vercel (`BrowserRouter` with an SPA rewrite in `vercel.json`)
- **AI backend:** two Vercel serverless functions — `api/assistant.ts` (chat with a pantry-search tool loop) and `api/scan.ts` (vision inventory analysis). The `ANTHROPIC_API_KEY` lives **only** in these functions; it is never embedded in the client bundle, and CI fails if it ever appears there.
- **Data:** Firebase Firestore, accessed directly from the browser and guarded by `firestore.rules` (public read for pantries/events; writes require staff/admin roles)
- **Game backend:** `sortshift-backend/` is a standalone AWS CDK app (API Gateway + Lambda + DynamoDB) with HMAC-signed single-use shift tokens, server-side plausibility checks, and no PII (initials only). Deploy it per its own [README](sortshift-backend/README.md), then point the SPA at it with `VITE_SORTSHIFT_API_URL`; without it the game runs in practice mode.

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`) for full-stack local development

### Installation

```bash
git clone https://github.com/dougdevitre/access-to-food.git
cd access-to-food
npm install
cp .env.example .env   # then fill in your keys
```

### Development

Two ways to run locally:

```bash
# UI-only (fast): plain Vite on http://localhost:3000.
# /api/* is not served, so the Assistant and Scanner show their
# "backend not configured" state — fine for working on pages and styling.
npm run dev

# Full stack: serves the SPA *and* the /api functions using the
# ANTHROPIC_API_KEY from .env (or `vercel env pull`).
vercel dev
```

Other scripts: `npm run lint` (typecheck), `npm run build`, `npm run preview`, `npm run seed`.

## Environment Variables

| Variable | Where it lives | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Server only — Vercel dashboard / `.env` for `vercel dev` | Claude API access for `/api/assistant` and `/api/scan`. **Never** prefix with `VITE_` or add to `vite.config.ts` — that would publish it in the bundle. |
| `VITE_GOOGLE_MAPS_API_KEY` | Build-time, embedded in the bundle by design | Google Maps for the pantry/event maps. Restrict by HTTP referrer in the Google Cloud console. |
| `VITE_SORTSHIFT_API_URL` | Build-time, embedded in the bundle by design | Base URL of the deployed Sort the Shift API (CDK `ApiUrl` output). Unset = practice mode. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Local only, for `npm run seed` | Path to a Firebase service-account JSON. |

## Seeding Sample Data

Firestore rules only allow staff/admin writes to `pantries` and `events`, so seeding uses the Firebase Admin SDK:

1. Firebase console → Project settings → Service accounts → **Generate new private key**, save as `serviceAccount.json` in the repo root (gitignored).
2. `export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json`
3. `npm run seed` (add `-- --force` to seed non-empty collections)

This writes ~10 St. Louis-area pantries and 6 upcoming events matching the `firestore.rules` schema.

## Deployment

The app deploys to Vercel (static build + serverless functions). After connecting the repo or running `vercel deploy`:

1. Add `ANTHROPIC_API_KEY` (and optionally `VITE_GOOGLE_MAPS_API_KEY`) in Project → Settings → Environment Variables, then redeploy.
2. Deploy Firestore rules when they change: `firebase deploy --only firestore:rules`.

CI (`.github/workflows/ci.yml`) typechecks, builds, and asserts the Anthropic key/SDK never reaches `dist/` on every PR and push to `main`. No secrets are needed at build time.

## Known Limitations

- The app has no sign-in flow yet, so Firestore writes gated on staff/admin roles (pantry updates, inventory-scan saves) will be denied until authentication is added. Public reads (pantries, events) work for everyone.
- Volunteer signups and donation flows are UI-only demos — they don't persist yet.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT — see [LICENSE](LICENSE) for details.

---

Part of the [Access To](https://cotrackpro.com) civic tech initiative — open-source tools for community access to justice, health, housing, and services.
