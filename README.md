# access-to-food

A community platform connecting people with food resources, pantries, volunteer opportunities, and more in the St. Louis area. Part of the **access-to** series.

**Live site:** [dougdevitre.github.io/access-to-food](https://dougdevitre.github.io/access-to-food/)

## Features

- **Find Food Now** -- Emergency food finder wizard with crisis hotline info
- **Partner Agencies** -- Searchable directory of food pantries with map view and geolocation
- **Distribution Events** -- Upcoming mobile markets, pop-ups, and drive-thru events
- **AI Assistant** -- Claude-powered chatbot that can search pantries and answer questions
- **Inventory Scanner** -- AI vision analysis of pantry shelves (staff only)
- **Volunteer Portal** -- Browse shifts, sign up, manage schedule, log hours with photo proof
- **Donate** -- Record monetary and food donations with receipt upload
- **SNAP Help** -- Eligibility calculator and contact info
- **Command Center** -- Admin dashboard with real-time inventory alerts, volunteer staffing charts, and hunger risk index (staff only)

## Tech Stack

- **Frontend:** React 19 + TypeScript (strict mode) + Tailwind CSS v4
- **Build:** Vite 6
- **Backend:** Firebase (Firestore, Auth, Storage)
- **AI:** Anthropic Claude API (chat + vision)
- **Maps:** Google Maps via @vis.gl/react-google-maps
- **Charts:** Recharts
- **Deployment:** GitHub Pages via GitHub Actions

## Local Development

**Prerequisites:** Node.js 20+

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local

# Start dev server
npm run dev
```

The app runs at `http://localhost:3000`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | For AI features | Powers the AI Assistant and Inventory Scanner |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript strict mode check |
| `npm run lint` | Run linter (TypeScript) |

## Deployment

The site auto-deploys to GitHub Pages on every push to `main` via the GitHub Actions workflow in `.github/workflows/deploy.yml`.

To set up:
1. Go to **Settings > Pages** and set Source to **GitHub Actions**
2. Add `ANTHROPIC_API_KEY` to **Settings > Secrets and variables > Actions**

## Authentication & Roles

The app uses Firebase Authentication with Google sign-in and email/password. User roles:

| Role | Access |
|------|--------|
| `resident` | Default. All public pages |
| `volunteer` | Public pages + volunteer features |
| `donor` | Public pages + donation tracking |
| `pantry_staff` | All above + Scanner + Command Center |
| `admin` | Full access |

## Project Structure

```
src/
  App.tsx                  # Router + auth provider + error boundary
  main.tsx                 # React entry point
  firebase.ts              # Firebase initialization
  contexts/
    AuthContext.tsx         # Auth state + user profile management
  components/
    Layout.tsx             # Sidebar nav + header + responsive layout
    ResourceMap.tsx         # Google Maps with colored markers
    ErrorBoundary.tsx       # React error boundary
    ProtectedRoute.tsx      # Role-based route guard
  pages/
    Home.tsx               # Landing page with intent toggle
    NeedFood.tsx           # Emergency food finder wizard
    Pantries.tsx           # Partner agency directory
    Events.tsx             # Distribution events
    Volunteer.tsx          # Volunteer shift management
    Donate.tsx             # Donation recording
    Snap.tsx               # SNAP eligibility calculator
    Resources.tsx          # FAQs and nutrition tips
    Assistant.tsx          # Claude AI chatbot
    Scanner.tsx            # AI inventory scanner
    CommandCenter.tsx      # Admin dashboard
    Login.tsx              # Authentication page
```
