# One-time setup: store Cloudflare deploy credentials in GitHub Actions secrets.
# Usage:
#   .\scripts\set-github-deploy-secrets.ps1 -ApiToken "YOUR_TOKEN"
# Or run without -ApiToken to be prompted (input hidden).

param(
  [string]$ApiToken,
  [string]$Repo = "laughingdragonsproductions/Them1947",
  [string]$AccountId = "d3d0d817a23ee9ca53fc6bbbbf22cc0f"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI (gh) is required."
}

if (-not $ApiToken) {
  $secure = Read-Host "Paste Cloudflare API token (Edit Cloudflare Workers template)" -AsSecureString
  $ApiToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}

if ([string]::IsNullOrWhiteSpace($ApiToken)) {
  throw "API token is required."
}

$env:CLOUDFLARE_API_TOKEN = $ApiToken
$env:CLOUDFLARE_ACCOUNT_ID = $AccountId

Write-Host "Validating token with wrangler..."
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
  npx wrangler whoami | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "wrangler whoami failed — check token permissions (use Edit Cloudflare Workers template)."
  }

  Write-Host "Setting GitHub secrets on $Repo ..."
  gh secret set CLOUDFLARE_ACCOUNT_ID -R $Repo -b $AccountId
  gh secret set CLOUDFLARE_API_TOKEN -R $Repo -b $ApiToken

  Write-Host "Done. Re-run deploy workflow:"
  Write-Host "  gh workflow run deploy-cloudflare-pages.yml -R $Repo"
} finally {
  Remove-Item Env:CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
  Remove-Item Env:CLOUDFLARE_ACCOUNT_ID -ErrorAction SilentlyContinue
  Pop-Location
}
