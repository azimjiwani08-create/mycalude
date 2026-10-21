@echo off
rem Windows: double-click to preview the site.
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Download it from https://nodejs.org ^(LTS^), then run this again. & pause & exit /b 1)
if not exist node_modules call npm install --no-audit --no-fund
rem Open the browser only once the site actually answers.
start "" /min powershell -NoProfile -Command "for($i=0;$i -lt 120;$i++){try{Invoke-WebRequest -UseBasicParsing http://localhost:3000 -TimeoutSec 2 ^| Out-Null; break}catch{Start-Sleep 1}}; Start-Process http://localhost:3000"
echo Starting Edu Tower preview at http://localhost:3000 (close this window to stop)
call npm run dev
echo The preview stopped. If you saw an error above, copy it and send it to us.
pause
