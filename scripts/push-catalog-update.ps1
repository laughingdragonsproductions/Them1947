param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Message,
  [switch]$StatsOnly
)

Set-Location (Split-Path $PSScriptRoot -Parent)

if ($StatsOnly) {
  python scripts/pull-makerworld-catalog.py --stats-only
  git add assets/js/catalog-data.js
} else {
  npm run rescan
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  git add assets/js/catalog-data.js assets/catalog/ files/prints/ sitemap.xml _redirects
}

git status

if (-not (git diff --cached --quiet)) {
  git commit -m $Message
  git push origin main
  Write-Host "Pushed to main. Cloudflare deploy workflow will run on push."
} else {
  Write-Host "Nothing to commit."
}
