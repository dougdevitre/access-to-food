# CLAUDE.md - Development Guide for AI Assistants

## Build & Test Commands

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Production build
npm run typecheck    # TypeScript strict mode check (run before committing)
npm run lint         # Same as typecheck
```

## Architecture

- **React 19** SPA with **HashRouter** (required for GitHub Pages)
- **Vite 6** build tool with Tailwind CSS v4 plugin
- **Firebase** backend: Firestore (database), Auth (authentication), Storage (file uploads)
- **Anthropic Claude API** called client-side via `@anthropic-ai/sdk` with `dangerouslyAllowBrowser: true`
- TypeScript **strict mode** enabled

## Key Patterns

### Firebase
- `src/firebase.ts` exports `db`, `auth`, `storage`
- Firestore collections: `users`, `pantries`, `events`, `volunteerShifts`, `donations`, `inventory_scans`
- Security rules in `firestore.rules` expect `request.auth` for write operations
- Schema defined in `firebase-blueprint.json`

### Authentication
- `src/contexts/AuthContext.tsx` provides `useAuth()` hook
- User profiles stored in `users/{uid}` with `role` field
- Roles: `resident`, `volunteer`, `donor`, `pantry_staff`, `admin`
- `ProtectedRoute` component gates Scanner and CommandCenter behind `pantry_staff`/`admin`
- Unauthenticated users get anonymous localStorage IDs for volunteer/donate features

### Routing
- HashRouter (not BrowserRouter) — required for GitHub Pages static hosting
- All routes lazy-loaded via `React.lazy()` for code splitting
- Vite base path: `/access-to-food/`

### Design System
- **Colors:** Emerald-700 (primary), Stone-50 to 900 (neutrals), Rose (danger), Amber (warning), Sky/Blue (info)
- **Spacing:** rounded-3xl cards, rounded-xl buttons, rounded-full pills
- **Shadows:** `shadow-[0_2px_8px_rgba(0,0,0,0.04)]` for cards
- **Icons:** lucide-react — import individual icons, not the whole library
- **Responsive:** Mobile-first, breakpoints at `md:` and `lg:`

### Component Conventions
- Pages in `src/pages/`, shared components in `src/components/`
- Use `clsx` for conditional class names
- Loading states: `Loader2` icon from lucide with `animate-spin`
- Notifications: inline toast with `animate-in fade-in` classes
- Forms: `bg-stone-50` inputs with `rounded-xl`, `focus:ring-2 focus:ring-emerald-500`

## Environment Variables
- `ANTHROPIC_API_KEY` — baked into build via Vite's `define` in `vite.config.ts`
- Accessed as `process.env.ANTHROPIC_API_KEY` in source code
- For GitHub Pages: set as repository secret, passed in CI workflow
