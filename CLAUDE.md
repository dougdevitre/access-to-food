# CLAUDE.md

## Commands

- `npm run dev` — Vite dev server on :3000, UI only (`/api/*` 404s; AI pages show their "not configured" state)
- `vercel dev` — full stack: SPA + `/api` serverless functions (needs `ANTHROPIC_API_KEY` in `.env`)
- `npm run lint` — `tsc --noEmit`; typechecks `src/`, `api/`, and `scripts/` (tsconfig has no `include`)
- `npm run build` — production build to `dist/`
- `npm run seed` — seed Firestore `pantries`/`events` via firebase-admin (needs `GOOGLE_APPLICATION_CREDENTIALS`)

There are no tests yet; CI runs lint + build + a bundle-leak grep.

## Architecture

- Vite + React 19 + TypeScript SPA, Tailwind CSS 4 (via `@tailwindcss/vite`), deployed on Vercel.
- Routing: `BrowserRouter` in `src/App.tsx` with lazy-loaded pages under `src/pages/`; `vercel.json` rewrites all non-`/api` paths to `/index.html`. Do not reintroduce `HashRouter` or a GitHub Pages base path.
- AI backend: `api/assistant.ts` and `api/scan.ts` (Vercel Node functions) call Claude (`claude-sonnet-5`, `thinking: disabled`) with the model, system prompt, tool schema, and max_tokens pinned server-side. Shared helpers in `api/_lib/claude.ts`. GET on either endpoint returns `{configured: boolean}`; errors use `{error: {code, message}}`.
- The Assistant's tool loop runs client-side: `src/pages/Assistant.tsx` POSTs history to `/api/assistant`, executes the `searchPantries` tool against Firestore in the browser, appends the `tool_result` turn, and POSTs again. `src/lib/api.ts` is the fetch helper (`postJson`, `getConfigured`, typed `ApiError`).
- Data: Firestore via `src/firebase.ts`, configured from `firebase-applet-config.json` with a **named database** (`firestoreDatabaseId`) — any Admin SDK usage must pass it to `getFirestore(app, dbId)`.

## Hard constraints

- **The Anthropic API key is server-side only.** Never add it to `vite.config.ts` `define`, any `VITE_`-prefixed var, or client code. Client imports of `@anthropic-ai/sdk` must be type-only (`import type Anthropic from '@anthropic-ai/sdk'`). CI greps `dist/assets` for `sk-ant-|dangerouslyAllowBrowser|ANTHROPIC_API_KEY` and fails on a match.
- `firestore.rules` gates writes: `pantries`/`events`/`inventory_scans` creates require admin or pantry_staff auth; the app has no sign-in flow yet, so those writes fail at runtime by design. Rules changes need `firebase deploy --only firestore:rules`.
- `VITE_GOOGLE_MAPS_API_KEY` is intentionally client-side (referrer-restricted); `ResourceMap.tsx` renders a fallback panel when it's unset.
