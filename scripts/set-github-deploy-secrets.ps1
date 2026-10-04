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

  $secretsDir = Join-Path $env:USERPROFILE ".openclaw\secrets"
  $tgPath = Join-Path $secretsDir "jarvis-telegram.env"
  $poPath = Join-Path $secretsDir "jarvis-pushover.env"
  if ((Test-Path $tgPath) -and (Test-Path $poPath)) {
    Write-Host "Loading Jarvis Telegram/Pushover secrets from $secretsDir ..."
    $tg = @{}
    $po = @{}
    Get-Content $tgPath | ForEach-Object {
      if ($_ -match '^\s*([^#=]+)=(.*)$') { $tg[$matches[1].Trim()] = $matches[2].Trim().Trim('"') }
    }
    Get-Content $poPath | ForEach-Object {
      if ($_ -match '^\s*([^#=]+)=(.*)$') { $po[$matches[1].Trim()] = $matches[2].Trim().Trim('"') }
    }
    if ($tg.TELEGRAM_BOT_TOKEN -and $tg.TELEGRAM_CHAT_ID) {
      gh secret set TELEGRAM_BOT_TOKEN -R $Repo -b $tg.TELEGRAM_BOT_TOKEN
      gh secret set TELEGRAM_CHAT_ID -R $Repo -b $tg.TELEGRAM_CHAT_ID
    } else {
      Write-Warning "jarvis-telegram.env missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID"
    }
    $pushUser = $po.PUSHOVER_USER_KEY
    if (-not $pushUser) { $pushUser = $po.PUSHOVER_USER }
    $pushApp = $po.PUSHOVER_APP_TOKEN
    if (-not $pushApp) { $pushApp = $po.APP_TOKEN }
    if ($pushUser -and $pushApp) {
      gh secret set PUSHOVER_USER_KEY -R $Repo -b $pushUser
      gh secret set PUSHOVER_APP_TOKEN -R $Repo -b $pushApp
    } else {
      Write-Warning "jarvis-pushover.env missing user/app token"
    }
  } else {
    Write-Warning "Jarvis env files not found; skip Telegram/Pushover GitHub secrets."
  }

  Write-Host "Done. Re-run deploy workflow:"
  Write-Host "  gh workflow run deploy-cloudflare-pages.yml -R $Repo"
  Write-Host "Or test rescan:"
  Write-Host "  gh workflow run rescan-catalog.yml -R $Repo"
} finally {
  Remove-Item Env:CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
  Remove-Item Env:CLOUDFLARE_ACCOUNT_ID -ErrorAction SilentlyContinue
  Pop-Location
}
