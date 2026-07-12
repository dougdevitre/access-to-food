# Production Verification Checklist

Local checks (typecheck, build, unit tests, the bundle leak-check, and the
mocked `/api` handlers) all pass, but a handful of paths can only be confirmed
against the live deployment. Run the automated smoke test first, then walk the
manual checks below.

## 0. Automated smoke test

```bash
npm run smoke -- https://food.cotrackpro.com
```

Covers the `/api` health + error paths, the SPA rewrite (deep links + `/api`
404s), the SEO/PWA files, and re-checks that no Anthropic key or SDK reached the
served bundle. All should PASS once the site is deployed with `ANTHROPIC_API_KEY`
set. (Against `npm run preview` the `/api/*` checks fail by design — no
functions are served there; use `vercel dev` or the real URL for those.)

## 1. Prerequisites in the Vercel dashboard

- [ ] `ANTHROPIC_API_KEY` set (a **rotated** key — the old one leaked via GitHub Pages).
- [ ] `VITE_GOOGLE_MAPS_API_KEY` set, if maps are wanted (build-time var).
- [ ] `VITE_SORTSHIFT_API_URL` set to the deployed game backend's API URL, if the game is wanted.
- [ ] Custom domain `food.cotrackpro.com` added in Vercel (Settings → Domains) and a `CNAME food → cname.vercel-dns.com` record added at the cotrackpro.com DNS host; SSL provisioned. The canonical URLs (`index.html` og:url, `public/sitemap.xml`, `public/robots.txt`) and the game backend's prod `corsOrigins` (`sortshift-backend/bin/app.ts`) already point at it. If the final domain differs, update those and redeploy both the site and the CDK stack.

## 2. Firebase (new origin)

- [ ] Add `food.cotrackpro.com` (and the `*.vercel.app` alias) to **Firebase Auth → authorized domains**.
- [ ] Add `food.cotrackpro.com` to the **Google Maps API key referrer allowlist**.
- [ ] Pantries and Events pages load real data from Firestore on the deployed origin (public reads).

## 3. AI Assistant (needs `ANTHROPIC_API_KEY`)

- [ ] Ask a plain question ("How does SNAP work?") → get a helpful answer.
- [ ] Ask "find food near 63101" → the pantry-search tool fires; the browser Network tab shows **two** POSTs to `/api/assistant` (tool call, then final answer), and the reply references pantry data.
- [ ] Temporarily unset the key (or before it's set): the amber "AI Assistant Unavailable" banner shows and the input is disabled.

## 4. Inventory Scanner (needs `ANTHROPIC_API_KEY`)

- [ ] Upload a real phone photo of a shelf → category cards render with stock levels.
- [ ] In the Network tab, the `/api/scan` request payload is well under 4.5 MB (client-side downscale working) even for a large original photo.
- [ ] A huge/edge-case image surfaces a friendly error message, not a crash or blank state.
- [ ] Mobile: the camera capture button opens the rear camera (`capture="environment"`).

## 5. Maps

- [ ] With `VITE_GOOGLE_MAPS_API_KEY` set: the map renders with pantry/event pins on Pantries, Events, Volunteer, and Command Center.
- [ ] Unset: the "Map unavailable" fallback panel shows (not a gray Google error tile).

## 6. Sort the Shift game

- [ ] With `VITE_SORTSHIFT_API_URL` set: play a full shift, post a score with initials, and the leaderboard updates. **This is also the end-to-end proof the backend prod CORS origin matches the site** — a CORS error here means `corsOrigins` in `sortshift-backend/bin/app.ts` doesn't match the deployed domain.
- [ ] Team code path: enter a valid event code and post to that event's leaderboard.
- [ ] Unset: the game runs in practice mode with an amber notice and no leaderboard.

## 7. Routing & PWA

- [ ] Hard-refresh a deep link (e.g. `/pantries`, `/sortshift`) → the app loads (rewrite works), no 404.
- [ ] The app is installable as a PWA (manifest + icons resolve at root paths).

## Known limitations (documented, not regressions)

- Scanner "Save to Database" and pantry/event writes fail — there's no sign-in flow yet, and `firestore.rules` gates those writes to admin/pantry_staff. Public reads work for everyone.
- Deploy updated Firestore rules when needed: `firebase deploy --only firestore:rules`.
