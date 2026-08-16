# Deploy the static site to Cloudflare Pages (bypasses broken Git auto-deploy).
# Prereq: npx wrangler login  OR  set CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "Deploying THEM 1947 from $Root to Cloudflare Pages project 'them1947'..."
npx wrangler pages deploy . --project-name=them1947 --branch=main
Write-Host "Done. Verify https://them1947.com/ shows 'Two transmissions play first' after hard refresh."
