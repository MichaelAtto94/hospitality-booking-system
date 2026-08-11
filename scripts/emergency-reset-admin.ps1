$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$ProjectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $ProjectRoot

Write-Host "ZedStay Emergency Administrator Recovery" -ForegroundColor Cyan
Write-Host "Run this only on the trusted hospitality server." -ForegroundColor Yellow
$email = (Read-Host "Super Administrator email").Trim().ToLowerInvariant()
$one = Read-Host "New strong password" -AsSecureString
$two = Read-Host "Confirm new password" -AsSecureString

function Plain([Security.SecureString]$value) {
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($value)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}

$password = Plain $one
$confirmation = Plain $two
try {
  if ($password -cne $confirmation) { throw "Passwords do not match." }
  if ($password.Length -lt 12 -or $password.Length -gt 72) { throw "Use 12 to 72 characters." }
  if ($password -cnotmatch "[A-Z]") { throw "Add an uppercase letter." }
  if ($password -cnotmatch "[a-z]") { throw "Add a lowercase letter." }
  if ($password -notmatch "[0-9]") { throw "Add a number." }
  if ($password -notmatch "[^A-Za-z0-9]") { throw "Add a special character." }
  $env:RECOVERY_EMAIL = $email
  $env:RECOVERY_PASSWORD = $password
  $usedDocker = $false
  if ($null -ne (Get-Command docker -ErrorAction SilentlyContinue) -and (Test-Path ".env.docker")) {
    $container = docker compose --env-file .env.docker ps -q application 2>$null
    if ($LASTEXITCODE -eq 0 -and $container) {
      docker compose --env-file .env.docker exec -T -e "RECOVERY_EMAIL=$email" -e "RECOVERY_PASSWORD=$password" application node scripts/emergency-reset-admin.mjs
      $usedDocker = $true
    }
  }
  if (-not $usedDocker) {
    if (-not (Test-Path ".env")) { throw "No running Docker application and .env was not found." }
    node --env-file=.env scripts/emergency-reset-admin.mjs
  }
  if ($LASTEXITCODE -ne 0) { throw "Emergency reset failed." }
}
finally {
  Remove-Item Env:RECOVERY_EMAIL -ErrorAction SilentlyContinue
  Remove-Item Env:RECOVERY_PASSWORD -ErrorAction SilentlyContinue
  $password = $null
  $confirmation = $null
}