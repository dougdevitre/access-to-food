# Production Verification Checklist

Local checks (typecheck, build, unit tests, the bundle leak-check, and the
mocked `/api` handlers) all pass, but a handful of paths can only be confirmed
against the live deployment. Run the automated smoke test first, then walk the
manual checks below.

## 0. Automated smoke test

```bash
npm run smoke -- https://food.dougdevitre.org
```

Covers the `/api` health + error paths, the SPA rewrite (deep links + `/api`
404s), the SEO/PWA files, and re-checks that no Anthropic key or SDK reached the
served bundle. All should PASS once the site is deployed with `ANTHROPIC_API_KEY`
set. (Against `npm run preview` the `/api/*` checks fail by design — no
functions are served there; use `vercel dev` or the real URL for those.)

## 1. Prerequisites in the Vercel dashboard

- [ ] `ANTHROPIC_API_KEY` set (a **rotated** key — the old one leaked via GitHub Pages).
- [ ] `VITE_SORTSHIFT_API_URL` set to the deployed game backend's API URL, if the game is wanted.
- [x] Custom domain `food.dougdevitre.org` added in Vercel and a `CNAME food → <project-specific>.vercel-dns-016.com` record added in Route 53 (dougdevitre.org zone); SSL provisioned. `food.cotrackpro.com` stays attached as a secondary domain.
- [ ] Canonical URLs (`index.html` og:url, `public/sitemap.xml`, `public/robots.txt`) point at `food.dougdevitre.org`. The game backend's prod `corsOrigins` (`sortshift-backend/bin/app.ts`) lists it first — **redeploy the CDK stack** for that to take effect.

## 2. Data (no database)

- [ ] Pantries, Events, Volunteer and Command Center show the built-in sample data, each with a visible "sample" label and a 2-1-1 pointer.

## 3. AI Assistant (needs `ANTHROPIC_API_KEY`)

- [ ] Ask a plain question ("How does SNAP work?") → get a helpful answer.
- [ ] Ask "find food near 63101" → the pantry-search tool fires; the browser Network tab shows **two** POSTs to `/api/assistant` (tool call, then final answer). The reply points to 2-1-1 and does **not** name any specific pantry.
- [ ] Temporarily unset the key (or before it's set): the amber "AI Assistant Unavailable" banner shows and the input is disabled.

## 4. Inventory Scanner (needs `ANTHROPIC_API_KEY`)

- [ ] Upload a real phone photo of a shelf → category cards render with stock levels.
- [ ] In the Network tab, the `/api/scan` request payload is well under 4.5 MB (client-side downscale working) even for a large original photo.
- [ ] A huge/edge-case image surfaces a friendly error message, not a crash or blank state.
- [ ] Mobile: the camera capture button opens the rear camera (`capture="environment"`).

## 5. Sort the Shift game

- [ ] With `VITE_SORTSHIFT_API_URL` set: play a full shift, post a score with initials, and the leaderboard updates. **This is also the end-to-end proof the backend prod CORS origin matches the site** — a CORS error here means `corsOrigins` in `sortshift-backend/bin/app.ts` doesn't match the deployed domain.
- [ ] Team code path: enter a valid event code and post to that event's leaderboard.
- [ ] Unset: the game runs in practice mode with an amber notice and no leaderboard.

## 6. Routing & PWA

- [ ] Hard-refresh a deep link (e.g. `/pantries`, `/sortshift`) → the app loads (rewrite works), no 404.
- [ ] The app is installable as a PWA (manifest + icons resolve at root paths).

## Known limitations (documented, not regressions)

- No database: listings are sample data and scanner results are not saved. Firebase and Google Maps were removed on 2026-10-20.
