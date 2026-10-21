@echo off
rem Windows: double-click to preview the site.
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Download it from https://nodejs.org ^(LTS^), then run this again. & pause & exit /b 1)
if not exist node_modules call npm install --no-audit --no-fund
start "" cmd /c "timeout /t 6 >nul & start http://localhost:3000"
echo Starting Edu Tower preview at http://localhost:3000 (close this window to stop)
npm run dev
