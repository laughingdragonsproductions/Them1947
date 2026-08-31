param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Message,
  [switch]$Full
)

Set-Location (Split-Path $PSScriptRoot -Parent)

if ($Full) {
  python scripts/pull-makerworld-catalog.py
  git add assets/js/catalog-data.js assets/catalog/ files/prints/ sitemap.xml
} else {
  python scripts/pull-makerworld-catalog.py --stats-only
  git add assets/js/catalog-data.js
}

git status

if (-not (git diff --cached --quiet)) {
  git commit -m $Message
  git push origin main
  Write-Host "Pushed to main. Cloudflare deploy workflow will run on push."
} else {
  Write-Host "Nothing to commit."
}
