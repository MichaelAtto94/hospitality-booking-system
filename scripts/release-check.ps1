param(
  [string]$EnvironmentFile = ".env.docker",
  [switch]$SkipBackup
)

$ErrorActionPreference = "Continue"
Set-Location (Split-Path $PSScriptRoot -Parent)
$startedAt = Get-Date
$results = [System.Collections.Generic.List[object]]::new()

function Add-Result {
  param([string]$Check, [string]$Status, [string]$Details)
  $results.Add([pscustomobject]@{ Check = $Check; Status = $Status; Details = $Details })
  $colour = if ($Status -eq "PASS") { "Green" } elseif ($Status -eq "SKIP") { "Yellow" } else { "Red" }
  Write-Host "[$Status] $Check - $Details" -ForegroundColor $colour
}

function Invoke-NativeCheck {
  param([string]$Name, [scriptblock]$Action)
  try {
    $global:LASTEXITCODE = 0
    & $Action
    if ($LASTEXITCODE -eq 0) { Add-Result $Name "PASS" "Completed successfully" }
    else { Add-Result $Name "FAIL" "Exited with code $LASTEXITCODE" }
  } catch {
    Add-Result $Name "FAIL" $_.Exception.Message
  }
}

Write-Host "Hospitality System Production Readiness Check" -ForegroundColor Cyan
Write-Host "Started: $startedAt`n"

foreach ($command in @("node", "npm", "docker")) {
  if (Get-Command $command -ErrorAction SilentlyContinue) {
    Add-Result "Tool: $command" "PASS" "Available"
  } else {
    Add-Result "Tool: $command" "FAIL" "Not installed or not in PATH"
  }
}

foreach ($file in @("package.json", "package-lock.json", "prisma\schema.prisma", "Dockerfile", "docker-compose.yml", $EnvironmentFile)) {
  if (Test-Path $file) { Add-Result "File: $file" "PASS" "Found" }
  else { Add-Result "File: $file" "FAIL" "Missing" }
}

if (Test-Path $EnvironmentFile) {
  $environmentText = Get-Content $EnvironmentFile -Raw
  $requiredKeys = @("POSTGRES_PASSWORD")
  foreach ($key in $requiredKeys) {
    if ($environmentText -match "(?m)^$key=.+$") { Add-Result "Environment: $key" "PASS" "Configured" }
    else { Add-Result "Environment: $key" "FAIL" "Missing or empty" }
  }
  if ($environmentText -match "(?i)(change-me|replace-me|your-password|example-secret)") {
    Add-Result "Production secrets" "FAIL" "Placeholder values remain in $EnvironmentFile"
  } else {
    Add-Result "Production secrets" "PASS" "No common placeholders detected"
  }
}

Invoke-NativeCheck "Install dependencies" { npm ci }
Invoke-NativeCheck "Production dependency audit" { npm audit --omit=dev --audit-level=high }
Invoke-NativeCheck "Prisma schema" { npx prisma validate }
Invoke-NativeCheck "Prisma Client" { npx prisma generate }
Invoke-NativeCheck "Lint" { npm run lint --if-present }
Invoke-NativeCheck "Automated tests" { npm test --if-present }
Invoke-NativeCheck "TypeScript" { npx tsc --noEmit }
Invoke-NativeCheck "Production build" { npm run build }

if ((Get-Command docker -ErrorAction SilentlyContinue) -and (Test-Path $EnvironmentFile)) {
  try {
    $services = docker compose --env-file $EnvironmentFile ps --status running --services 2>&1
    if ($LASTEXITCODE -eq 0 -and $services -contains "application" -and $services -contains "database") {
      Add-Result "Docker services" "PASS" "Application and database are running"
    } else {
      Add-Result "Docker services" "FAIL" "Application and database must both be running"
    }
  } catch { Add-Result "Docker services" "FAIL" $_.Exception.Message }

  try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 15
    Add-Result "Health endpoint" "PASS" "Application responded successfully"
  } catch { Add-Result "Health endpoint" "FAIL" $_.Exception.Message }
}

if ($SkipBackup) {
  Add-Result "Database backup" "SKIP" "Skipped by request"
} elseif (Test-Path ".\scripts\backup-database.ps1") {
  try {
    & ".\scripts\backup-database.ps1" -EnvironmentFile $EnvironmentFile
    if ($LASTEXITCODE -eq 0) { Add-Result "Database backup" "PASS" "Validated backup created" }
    else { Add-Result "Database backup" "FAIL" "Backup command failed" }
  } catch { Add-Result "Database backup" "FAIL" $_.Exception.Message }
} else {
  Add-Result "Database backup" "FAIL" "Install database backup tools first"
}

$endedAt = Get-Date
$passed = @($results | Where-Object Status -eq "PASS").Count
$failed = @($results | Where-Object Status -eq "FAIL").Count
$skipped = @($results | Where-Object Status -eq "SKIP").Count
$overall = if ($failed -eq 0) { "READY" } else { "NOT READY" }
$stamp = $startedAt.ToString("yyyyMMdd-HHmmss")
$reportPath = Join-Path (Join-Path (Get-Location) "reports") "release-check-$stamp.md"

$lines = @(
  "# Production readiness report",
  "",
  "- Result: **$overall**",
  "- Started: $startedAt",
  "- Completed: $endedAt",
  "- Passed: $passed",
  "- Failed: $failed",
  "- Skipped: $skipped",
  "",
  "| Check | Status | Details |",
  "| --- | --- | --- |"
)
foreach ($item in $results) {
  $safeDetails = $item.Details.Replace("|", "\|").Replace("`r", " ").Replace("`n", " ")
  $lines += "| $($item.Check) | $($item.Status) | $safeDetails |"
}
$lines | Set-Content $reportPath -Encoding UTF8

Write-Host "`nOverall result: $overall" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "Report: $reportPath" -ForegroundColor Cyan
if ($failed -gt 0) { exit 1 }

