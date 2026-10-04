# Register Jarvis-Them1947-Rescan: Mon/Thu PC fallback if GitHub scan did not succeed.
# Run once from an elevated or normal user session (same pattern as Jarvis status reports).

$ErrorActionPreference = "Stop"

$taskName = "Jarvis-Them1947-Rescan"
$scriptPath = Join-Path (Split-Path $PSScriptRoot -Parent) "scripts\rescan-fallback.ps1"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday, Thursday -At "10:00AM"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 2)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "THEM1947 MakerWorld rescan fallback when GitHub Actions is blocked" -Force | Out-Null

Write-Host "Registered scheduled task: $taskName (Mon/Thu 10:00 AM, start when available)"
