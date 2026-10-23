# CLAUDE.md

## Commands

- `npm run dev` — Vite dev server on :3000, UI only (`/api/*` 404s; AI pages show their "not configured" state)
- `vercel dev` — full stack: SPA + `/api` serverless functions (needs `ANTHROPIC_API_KEY` in `.env`)
- `npm run lint` — `tsc --noEmit`; typechecks `src/`, `api/`, and `scripts/` (tsconfig has no `include`)
- `npm run build` — production build to `dist/`
- `npm test` — Vitest over `test/**/*.test.{ts,tsx}` (Node by default; a test that needs a DOM opts in with `// @vitest-environment jsdom` and `@testing-library/react`). Suites: `api` (the `/api` handlers' gating), `client-api` (`src/lib/api`), `assistant-loop` (the tool loop with `/api/assistant` mocked), `sortshift` (client rules against the backend's `validate.ts`), `no-client-sdk` (no value import of `@anthropic-ai/sdk` under `src/`), `disclaimer`, `phone-check`, `calendar`. `sortshift-backend/` has its own `npm test`.

CI (`.github/workflows/ci.yml`) runs lint, test, build and a bundle-leak grep, plus the backend's typecheck and tests.

## Architecture

- Vite + React 19 + TypeScript SPA, Tailwind CSS 4 (via `@tailwindcss/vite`), deployed on Vercel.
- Routing: `BrowserRouter` in `src/App.tsx` with lazy-loaded pages under `src/pages/`; `vercel.json` rewrites all non-`/api` paths to `/index.html`. Do not reintroduce `HashRouter` or a GitHub Pages base path.
- AI backend: `api/assistant.ts` and `api/scan.ts` (Vercel Node functions) call Claude (`claude-sonnet-5`, `thinking: disabled`) with the model, system prompt, tool schema, and max_tokens pinned server-side. Shared helpers in `api/_lib/claude.ts`. GET on either endpoint returns `{configured: boolean}`; errors use `{error: {code, message}}`.
- The Assistant's tool loop runs client-side: `src/pages/Assistant.tsx` POSTs history to `/api/assistant`, executes the `searchPantries` tool in the browser (it currently returns no listings and a 2-1-1 referral, because the only data is sample data), appends the `tool_result` turn, and POSTs again. `src/lib/api.ts` is the fetch helper (`postJson`, `getConfigured`, typed `ApiError`).
- Data: no database. Firebase and Google Maps were removed on 2026-10-20. Pantries/Events/Volunteer/CommandCenter read built-in sample data from `src/lib/sampleData.ts` (fictional orgs, 555 numbers) and must keep labeling it as sample data. Never let the AI assistant recommend sample listings.
- Game: `src/pages/SortShift.tsx` + `src/lib/sortshift.ts` talk to `sortshift-backend/` (standalone AWS CDK app with its own package.json/tests, **excluded from the root tsconfig** — typecheck/test it from inside its directory). The SPA finds it via `VITE_SORTSHIFT_API_URL` and falls back to practice mode when unset. Game rules must respect the backend's integrity checks: shift ≥ 55s before score submit, `meals = round(lbs / 1.2)`, initials `[A-Z]{1,3}`.

## Hard constraints

- **The Anthropic API key is server-side only.** Never add it to `vite.config.ts` `define`, any `VITE_`-prefixed var, or client code. Client imports of `@anthropic-ai/sdk` must be type-only (`import type Anthropic from '@anthropic-ai/sdk'`). CI greps `dist/assets` for `sk-ant-|dangerouslyAllowBrowser|api\.anthropic\.com` and fails on a match; `test/no-client-sdk.test.ts` fails earlier, at the source.
