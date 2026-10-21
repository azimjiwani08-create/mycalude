#!/bin/bash
# Mac/Linux: double-click (or run ./start-preview.command) to preview the site.
cd "$(dirname "$0")"
if ! command -v node >/dev/null; then
  echo "Node.js is not installed. Download it from https://nodejs.org (LTS), then run this again."
  read -r -p "Press Enter to close." _; exit 1
fi
[ -d node_modules ] || npm install --no-audit --no-fund
( sleep 6; open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null ) &
echo "Starting Edu Tower preview at http://localhost:3000 (close this window to stop)"
npm run dev
