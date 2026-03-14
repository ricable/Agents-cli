#!/usr/bin/env bash
# deploy-local.sh — Build agents-cli and serve saas-ui locally on port 8080.
# Usage: ./deploy-local.sh [--port 8080] [--no-build]

set -euo pipefail

PORT=8080
SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --port) PORT="$2"; shift 2 ;;
    --no-build) SKIP_BUILD=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

ROOT="$(cd "$(dirname "$0")" && pwd)"
SAAS_DIR="$ROOT/examples/saas-ui"

# ── Load .env ────────────────────────────────────────────────────────
if [[ -f "$ROOT/.env" ]]; then
  echo "▶  Loading .env..."
  set -a
  # shellcheck disable=SC1090
  source "$ROOT/.env"
  set +a
fi

# ── Validate required env vars ───────────────────────────────────────
MISSING=()
[[ -z "${CLERK_PUBLISHABLE_KEY:-}" ]] && MISSING+=("CLERK_PUBLISHABLE_KEY")
[[ -z "${CLERK_SECRET_KEY:-}" ]]      && MISSING+=("CLERK_SECRET_KEY")
[[ -z "${STRIPE_SECRET_KEY:-}" ]]     && MISSING+=("STRIPE_SECRET_KEY")
[[ -z "${STRIPE_WEBHOOK_SECRET:-}" ]] && MISSING+=("STRIPE_WEBHOOK_SECRET")

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "⚠  Missing env vars in .env: ${MISSING[*]}"
  echo "   Add them to $ROOT/.env and retry."
  echo "   Continuing in mock mode..."
else
  echo "✓  All env vars loaded."
fi

# ── Stop old processes ───────────────────────────────────────────────
echo "▶  Stopping any process on port $PORT and 3100..."
lsof -ti :"$PORT" | xargs -r kill -9 2>/dev/null || true
lsof -ti :3100 | xargs -r kill -9 2>/dev/null || true
sleep 0.5

# ── Build ────────────────────────────────────────────────────────────
if [[ "$SKIP_BUILD" == false ]]; then
  echo "▶  Building agents-cli..."
  cd "$ROOT"
  npm run build
fi

# ── Start companion API (port 3100) ──────────────────────────────────
echo "▶  Starting companion API on http://localhost:3100..."
cd "$ROOT"
npx tsx examples/skill-forge.ts --companion --serve --port 3100 &>/tmp/companion-server.log &
COMPANION_PID=$!

# Wait for companion to be ready (max 10s)
for i in $(seq 1 20); do
  curl -sf http://localhost:3100/api/health &>/dev/null && break
  sleep 0.5
done

if curl -sf http://localhost:3100/api/health &>/dev/null; then
  echo "✓  Companion API PID $COMPANION_PID — http://localhost:3100"
else
  echo "✗  Companion API failed to start. Check /tmp/companion-server.log"
  exit 1
fi

# ── Serve saas-ui (port $PORT) ────────────────────────────────────────
echo "▶  Serving saas-ui on http://localhost:$PORT"
cd "$SAAS_DIR"

# npx serve --single enables SPA routing: all paths (incl. /sso-callback) serve index.html
# python3 -m http.server does NOT do this, breaking Clerk OAuth callbacks
npx serve -p "$PORT" --single . &
SERVER_PID=$!

echo "✓  SaaS UI PID $SERVER_PID — http://localhost:$PORT"
echo ""
echo "   Companion: http://localhost:3100/api/health"
echo "   SaaS UI:   http://localhost:$PORT"
echo "   Press Ctrl-C to stop both."

# Open browser on macOS
if [[ "$(uname)" == "Darwin" ]]; then
  sleep 0.8
  open "http://localhost:$PORT"
fi

# Trap Ctrl-C to kill both servers
trap 'echo ""; echo "Stopping..."; kill $COMPANION_PID $SERVER_PID 2>/dev/null; exit 0' INT TERM

wait $SERVER_PID
