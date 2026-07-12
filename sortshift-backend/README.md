# sortshift-backend

Serverless backend for **Sort the Shift** — a volunteer training and engagement game inspired by the St. Louis Area Foodbank. Standalone civic project; own namespace (`/sortshift/<env>/*`). See `sort-the-shift-backend-spec.md` for the full spec.

## Stack
TypeScript · API Gateway HTTP API + Lambda (Node 20) · DynamoDB single-table (`pk`/`sk` + `gsi1`) · CDK · Clerk (coordinator auth) · SSM SecureString.

## Layout
```
bin/app.ts                  CDK app (dev + prod stacks)
lib/sortshift-stack.ts      Table, GSI, Lambdas, routes, least-privilege IAM
src/types.ts                Shared types
src/lib/
  token.ts                  HMAC shift tokens (issue/verify, timing-safe)
  validate.ts               Initials, plausibility, elapsed, event codes
  ddb.ts                    Doc client + key builders + TTL helpers
  secrets.ts                SSM SecureString fetch with cache (env override for dev/test)
  auth.ts                   Clerk JWT verify via JWKS (jose)
  http.ts / csv.ts          Response + CSV helpers
src/handlers/               shiftStart, submitScore, leaderboard, events, misses, exportCsv
test/                       Vitest unit tests (token, validate, csv)
```

## Commands
```bash
npm install
npm run typecheck     # tsc --noEmit
npm test              # vitest run
```

## Deploy (dev)
```bash
# 1. Create the HMAC key (once per env) — 32+ random bytes
aws ssm put-parameter --name /sortshift/dev/hmac-key --type SecureString \
  --value "$(openssl rand -base64 48)"

# 2. Set Clerk env for coordinator routes (or leave blank to disable coordinator auth in dev)
export CLERK_JWKS_URL="https://<your-clerk>.clerk.accounts.dev/.well-known/jwks.json"
export CLERK_ISSUER="https://<your-clerk>.clerk.accounts.dev"

# 3. Deploy
npx cdk deploy SortShift-dev
```

Before first **prod** deploy: replace the placeholder CORS origin in `bin/app.ts` with the real game domain.

## Integrity model (summary)
- `POST /v1/shifts/start` issues an HMAC-signed single-use token; `POST /v1/scores` burns it in a DynamoDB transaction (replay → 409).
- Server-side elapsed-time window (55s–15min) and plausibility ceiling (`MAX_MEALS_PER_SHIFT`, lbs↔meals consistency at ~1.2 lbs/meal).
- No PII: initials only (`[A-Z]{1,3}` + blocklist). Scores TTL out after 180 days.

## Not yet implemented (per spec rollout)
- Per-IP-hash rate bucket (API Gateway throttling covers pilot scale)
- CloudFront cache in front of leaderboard GETs
- Integration tests against DynamoDB Local; artillery load test
