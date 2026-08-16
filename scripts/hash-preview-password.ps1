# Generate SHA-256 hex for previewGate.passwordHash in assets/js/config.js
# Usage: .\scripts\hash-preview-password.ps1
#        .\scripts\hash-preview-password.ps1 -ClearanceCode 'YourCode'

param(
  [string]$ClearanceCode
)

if (-not $ClearanceCode) {
  $secure = Read-Host "Clearance code (input hidden)" -AsSecureString
  $ClearanceCode = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}

if ([string]::IsNullOrWhiteSpace($ClearanceCode)) {
  Write-Error "No clearance code provided."
  exit 1
}

$bytes = [System.Text.Encoding]::UTF8.GetBytes($ClearanceCode)
$hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
$hex = ([BitConverter]::ToString($hash) -replace '-', '').ToLower()

Write-Host ""
Write-Host "Paste into assets/js/config.js -> previewGate.passwordHash:"
Write-Host $hex
Write-Host ""
Write-Host "Do not commit the plaintext clearance code."
