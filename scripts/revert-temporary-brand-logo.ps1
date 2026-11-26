# Clears temporary brand logo from config after the promo week (Jarvis / manual).
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

node scripts/revert-temporary-brand-logo.js
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run check
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

git add assets/js/config.js
if (git diff --cached --quiet) {
  Write-Host "Nothing to commit."
  exit 0
}

git commit -m "chore: revert temporary Electronic Warfare brand logo"
git push origin main
Write-Host "Pushed brand logo revert to main."