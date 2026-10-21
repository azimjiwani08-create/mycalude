#!/bin/bash
# Mac/Linux: double-click (or run ./start-preview.command) to preview the site.
cd "$(dirname "$0")"
if ! command -v node >/dev/null; then
  echo "Node.js is not installed. Download it from https://nodejs.org (LTS), then run this again."
  read -r -p "Press Enter to close." _; exit 1
fi
[ -d node_modules ] || npm install --no-audit --no-fund
# Open the browser only once the site actually answers.
( for i in $(seq 1 120); do curl -s -o /dev/null http://localhost:3000 && break; sleep 1; done
  open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null ) &
echo "Starting Edu Tower preview at http://localhost:3000 (close this window to stop)"
npm run dev
echo "The preview stopped. If you saw an error above, copy it and send it to us."
read -r -p "Press Enter to close." _
