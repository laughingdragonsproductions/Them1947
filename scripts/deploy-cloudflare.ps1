# Deploy the static site to the them1947.com Cloudflare Worker (static assets).
# Prereq: npx wrangler login  OR  set CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "Deploying THEM 1947 from $Root to Cloudflare Worker 'them1947'..."
node scripts/prepare-worker-deploy.js
npx wrangler deploy
Write-Host "Done. Verify https://them1947.com/ shows 'Two transmissions play first' after hard refresh."
