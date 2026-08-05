param(
  [string]$EnvironmentFile = ".env.docker"
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker is not available. Start Docker Desktop and retry."
}
if (-not (Test-Path $EnvironmentFile)) {
  throw "$EnvironmentFile was not found."
}

$containerId = (docker compose --env-file $EnvironmentFile ps -q database).Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($containerId)) {
  throw "The database container is not running. Run: docker compose --env-file $EnvironmentFile up -d"
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$fileName = "hospitality-$stamp.dump"
$containerFile = "/tmp/$fileName"
$localFile = Join-Path (Join-Path (Get-Location) "backups") $fileName

Write-Host "Creating PostgreSQL backup..." -ForegroundColor Cyan
docker exec $containerId sh -c "pg_dump -U `$POSTGRES_USER -d `$POSTGRES_DB -Fc -f '$containerFile'"
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed." }

docker exec $containerId pg_restore -l $containerFile | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Backup validation failed." }

docker cp "${containerId}:$containerFile" $localFile | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Could not copy the backup to Windows." }

docker exec $containerId rm -f $containerFile | Out-Null

$size = (Get-Item $localFile).Length
if ($size -lt 100) { throw "The backup file is unexpectedly small." }

Write-Host "Backup completed: $localFile" -ForegroundColor Green
Write-Host "Size: $([math]::Round($size / 1KB, 2)) KB"
