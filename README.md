# Access To Food

<!-- BEGIN DISCLAIMER: synced from dougdevitre/access-to, edit it there -->
> [!IMPORTANT]
> **Educational information only.** Access to Food is not legal, medical, mental health, financial or safety advice, and using it creates no professional relationship. **In danger now? Call 911. For crisis support, call or text 988.** Confirm anything important with the official source or a licensed professional. Read the full [disclaimer](DISCLAIMER.md).
<!-- END DISCLAIMER -->

> A community platform connecting people with food resources in the St. Louis area — pantry locators, distribution events, SNAP guidance, an AI food-access assistant, and tools for volunteers and pantry staff. Part of the Access To initiative.

> Part of **[Access To](https://dougdevitre.org)** — open-source tools for the access gaps that matter most. [See all projects →](https://dougdevitre.org/about.html#pillars)
>
> Maintained by **Doug Devitre, Community Development Catalyst** · [dougdevitre.org](https://dougdevitre.org)

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Live site:** https://food.dougdevitre.org (also served at https://food.cotrackpro.com)

## Features

- **Pantry directory** — browse partner food pantries with inventory status. Listings are built-in **sample data** for now, clearly labeled, with a pointer to 2-1-1.
- **Distribution events** — upcoming mobile markets, pop-up pantries, and drive-thru distributions
- **AI Assistant** — a Claude-powered chat assistant for food-access questions. Until a verified directory is connected, it refers pantry searches to 2-1-1 instead of naming specific pantries.
- **Inventory Scanner** — pantry staff photograph shelves and Claude vision estimates stock levels by category
- **SNAP eligibility guide** — quick income-based eligibility estimate and application resources
- **Volunteer & donate** — shift signups and donation information
- **Sort the Shift** — a volunteer-training game: sort donations into the right bins, flag spoiled items, post your meals-provided score to a leaderboard
- **Command Center dashboard** — at-a-glance pantry status, staffing, and risk overview

## Architecture

- **Frontend:** Vite + React 19 + TypeScript + Tailwind CSS 4, a single-page app served statically by Vercel (`BrowserRouter` with an SPA rewrite in `vercel.json`)
- **AI backend:** two Vercel serverless functions — `api/assistant.ts` (chat with a pantry-search tool loop) and `api/scan.ts` (vision inventory analysis). The `ANTHROPIC_API_KEY` lives **only** in these functions; it is never embedded in the client bundle, and CI fails if it ever appears there.
- **Data:** no database for now. Pantry, event and dashboard data is built-in sample data in `src/lib/sampleData.ts`. Firebase and Google Maps were removed (2026-10-20) until a verified live directory is chosen.
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

Other scripts: `npm run lint` (typecheck), `npm run build`, `npm run preview`.

## Environment Variables

| Variable | Where it lives | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Server only — Vercel dashboard / `.env` for `vercel dev` | Claude API access for `/api/assistant` and `/api/scan`. **Never** prefix with `VITE_` or add to `vite.config.ts` — that would publish it in the bundle. |
| `VITE_SORTSHIFT_API_URL` | Build-time, embedded in the bundle by design | Base URL of the deployed Sort the Shift API (CDK `ApiUrl` output). Unset = practice mode. |

## Deployment

The app deploys to Vercel (static build + serverless functions). After connecting the repo or running `vercel deploy`:

1. Add `ANTHROPIC_API_KEY` in Project → Settings → Environment Variables, then redeploy.

CI (`.github/workflows/ci.yml`) typechecks, builds, and asserts the Anthropic key/SDK never reaches `dist/` on every PR and push to `main`. No secrets are needed at build time.

## Known Limitations

- Pantry, event and dashboard listings are sample data (fictional names, 555 numbers). Every listing page says so and points to 2-1-1.
- No maps. Pantry and event cards keep their "Directions" links, which open a plain map search with no API key.
- Inventory-scanner results are not saved.
- Volunteer signups and donation flows are UI-only demos — they don't persist yet.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT — see [LICENSE](LICENSE) for details.

---

Part of the [Access To](https://dougdevitre.org) civic tech initiative — open-source tools for community access to justice, health, housing, and services.
