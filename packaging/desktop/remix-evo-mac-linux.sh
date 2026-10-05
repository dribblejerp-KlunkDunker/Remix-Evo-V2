#!/usr/bin/env bash
set -e

echo "========================================================"
echo "  Remix Evo: Autonomous Agent Skills Matrix (Desktop)"
echo "========================================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not found on your laptop."
    echo "Please download and install Node.js (v20+ or v22+) from:"
    echo "https://nodejs.org/"
    echo ""
    exit 1
fi

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "Creating local .env configuration..."
        cp .env.example .env
    fi
fi

if [ ! -d node_modules ]; then
    echo "Installing dependencies on your laptop..."
    npm install
fi

echo "Launching Remix Evo on your laptop..."
# Open browser
if command -v xdg-open >/dev/null 2>&1; then
    (sleep 2 && xdg-open http://localhost:3000) &
elif command -v open >/dev/null 2>&1; then
    (sleep 2 && open http://localhost:3000) &
fi

npm run dev
