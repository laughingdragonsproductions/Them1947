# PC fallback when GitHub-hosted MakerWorld rescan is blocked or missed.
param(
  [string]$Repo = "laughingdragonsproductions/Them1947",
  [string]$Worktree = "G:\LocalAIagent\Them1947-bot",
  [string]$LogPath = "G:\openclaw\business\jarvis\state\them1947-rescan.log"
)

$ErrorActionPreference = "Stop"

function Write-Log([string]$Message) {
  $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $line = "[$stamp] $Message"
  Write-Host $line
  $dir = Split-Path $LogPath -Parent
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  Add-Content -Path $LogPath -Value $line
}

function Send-Notify([string]$Mode, [switch]$Failure) {
  $args = @("scripts/notify.js", $Mode)
  if ($Failure) { $args += "--failure" }
  & node @args 2>&1 | Out-Null
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI (gh) is required for rescan fallback."
}

$today = (Get-Date).ToString("yyyy-MM-dd")
Write-Log "Checking GitHub rescan runs for $today"

$runs = gh run list -R $Repo --workflow rescan-catalog.yml --limit 10 --json databaseId,conclusion,createdAt,status 2>$null | ConvertFrom-Json
$successToday = $false
foreach ($run in $runs) {
  if ($run.status -ne "completed") { continue }
  if ($run.conclusion -ne "success") { continue }
  $created = [DateTime]::Parse($run.createdAt).ToUniversalTime().Date
  if ($created.ToString("yyyy-MM-dd") -eq $today) {
    $successToday = $true
    break
  }
}

if ($successToday) {
  Write-Log "GitHub rescan already succeeded today; exiting."
  exit 0
}

Write-Log "No successful GitHub rescan today; running local fallback in $Worktree"

$root = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path $Worktree)) {
  Write-Log "Creating bot worktree at $Worktree"
  git -C $root worktree add $Worktree main
}

Push-Location $Worktree
try {
  git fetch origin main
  git checkout main
  git pull --ff-only origin main

  npm ci
  pip install curl_cffi 2>$null

  $pullExit = 0
  npm run rescan
  if ($LASTEXITCODE -ne 0) {
    $pullExit = $LASTEXITCODE
    if ($pullExit -eq 2) {
      Write-Log "Local rescan blocked by MakerWorld (exit 2)."
      Send-Notify scan
      exit 2
    }
    Write-Log "Local rescan failed with exit $pullExit"
    Send-Notify scan -Failure
    exit $pullExit
  }

  git add assets/js/catalog-data.js assets/catalog/ files/prints/ sitemap.xml _redirects
  if (git diff --staged --quiet) {
    Write-Log "Rescan completed with no file changes."
    exit 0
  }

  git config user.name "Brandon Sparks"
  git config user.email "laughingdragonsproductions@gmail.com"
  git commit -m "chore: refresh MakerWorld catalog (PC fallback rescan)"
  git push origin main
  Write-Log "Pushed catalog refresh from PC fallback."

  Send-Notify scan
} catch {
  Write-Log "ERROR: $($_.Exception.Message)"
  Send-Notify scan -Failure
  throw
} finally {
  Pop-Location
}
