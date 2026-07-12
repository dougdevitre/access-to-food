#!/usr/bin/env bash
# Post-deploy smoke test for access-to-food. Verifies the parts that can only
# be confirmed against a running server: the /api serverless functions, the
# SPA rewrite, the SEO/PWA files, and the no-Anthropic-key-in-bundle guarantee.
#
# Usage:
#   bash scripts/smoke-test.sh [base-url]
#   npm run smoke -- https://food.cotrackpro.com
#
# Default base URL is the production site. Point it at `vercel dev`
# (http://localhost:3000) or a preview URL as needed.
#
# Against a plain static host (`npm run preview`) the /api checks fail because
# no functions are served — that's expected; run those against `vercel dev`
# or the real deployment.

set -u

BASE="${1:-https://food.cotrackpro.com}"
BASE="${BASE%/}"

pass=0
fail=0

green() { printf '\033[32mPASS\033[0m'; }
red()   { printf '\033[31mFAIL\033[0m'; }

# check <name> <expected-status> <method> <path> [body] [content-transform]
# Asserts HTTP status; optionally asserts the body contains a substring passed
# as $6 (a grep -F pattern). Body assertion is skipped when $6 is empty.
check() {
  local name="$1" want="$2" method="$3" path="$4" body="${5:-}" needle="${6:-}"
  local url="$BASE$path"
  local resp code out
  if [ -n "$body" ]; then
    resp=$(curl -sS -m 30 -o /tmp/smoke_body -w '%{http_code}' \
      -X "$method" -H 'content-type: application/json' -d "$body" "$url" 2>/dev/null)
  else
    resp=$(curl -sS -m 30 -o /tmp/smoke_body -w '%{http_code}' -X "$method" "$url" 2>/dev/null)
  fi
  code="$resp"
  out=$(cat /tmp/smoke_body 2>/dev/null || echo "")

  local ok=1 reason=""
  if [ "$code" != "$want" ]; then ok=0; reason="got status $code, wanted $want"; fi
  if [ "$ok" = 1 ] && [ -n "$needle" ] && ! printf '%s' "$out" | grep -qF "$needle"; then
    ok=0; reason="status $code ok, but body missing \"$needle\""
  fi

  if [ "$ok" = 1 ]; then
    green; printf '  %-46s %s %s\n' "$name" "$method" "$path"; pass=$((pass+1))
  else
    red; printf '  %-46s %s %s (%s)\n' "$name" "$method" "$path" "$reason"; fail=$((fail+1))
  fi
}

echo "Smoke-testing: $BASE"
echo

echo "── API functions ──────────────────────────────────────────"
check "assistant health"        200 GET    /api/assistant       "" 'configured'
check "scan health"             200 GET    /api/scan            "" 'configured'
check "assistant wrong method"  405 DELETE /api/assistant
check "assistant empty messages" 400 POST  /api/assistant       '{"messages":[]}'         'invalid_request'
check "scan bad mimeType"       400 POST   /api/scan            '{"mimeType":"image/tiff","base64Data":"abc"}' 'invalid_request'

echo
echo "── SPA rewrite & static files ─────────────────────────────"
check "deep link serves SPA"    200 GET    /pantries            "" '<div id="root">'
# The rewrite must NOT swallow /api — an unknown api path is a real 404, not HTML.
api_miss=$(curl -sS -m 30 -o /tmp/smoke_body -w '%{http_code}' "$BASE/api/does-not-exist" 2>/dev/null)
if [ "$api_miss" = "404" ] && ! grep -qF '<div id="root">' /tmp/smoke_body; then
  green; printf '  %-46s GET /api/does-not-exist\n' "unknown api path is 404, not SPA"; pass=$((pass+1))
else
  red; printf '  %-46s GET /api/does-not-exist (status %s)\n' "unknown api path is 404, not SPA" "$api_miss"; fail=$((fail+1))
fi
check "sitemap.xml"             200 GET    /sitemap.xml
check "robots.txt"              200 GET    /robots.txt
check "manifest.json"           200 GET    /manifest.json
check "icon-192.svg"            200 GET    /icons/icon-192.svg

echo
echo "── Bundle secret leak check ───────────────────────────────"
# Scrape the module entry (Vite emits <script type="module" src="/assets/…">)
# from the served HTML, fetch it, and assert no key material leaked.
index_html=$(curl -sS -m 30 "$BASE/" 2>/dev/null || echo "")
entry=$(printf '%s' "$index_html" | grep -oE '/assets/[^"]+\.js' | head -1)
if [ -z "$entry" ]; then
  red; printf '  %-46s (could not find /assets/*.js entry in index.html)\n' "locate JS bundle"; fail=$((fail+1))
else
  bundle=$(curl -sS -m 30 "$BASE$entry" 2>/dev/null || echo "")
  if printf '%s' "$bundle" | grep -qE 'sk-ant-|dangerouslyAllowBrowser|api\.anthropic\.com'; then
    red; printf '  %-46s %s  <-- KEY OR SDK LEAKED\n' "no Anthropic key/SDK in bundle" "$entry"; fail=$((fail+1))
  else
    green; printf '  %-46s %s\n' "no Anthropic key/SDK in bundle" "$entry"; pass=$((pass+1))
  fi
fi

echo
echo "───────────────────────────────────────────────────────────"
printf 'Passed: %s   Failed: %s\n' "$pass" "$fail"
[ "$fail" = 0 ]
