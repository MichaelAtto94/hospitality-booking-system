param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile,
  [string]$EnvironmentFile = ".env.docker"
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
$resolvedBackup = (Resolve-Path $BackupFile -ErrorAction Stop).Path

if ([IO.Path]::GetExtension($resolvedBackup) -ne ".dump") {
  throw "Select a .dump file created by the backup script."
}

$containerId = (docker compose --env-file $EnvironmentFile ps -q database).Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($containerId)) {
  throw "The database container is not running."
}

Write-Host "WARNING: This replaces the current Docker database data." -ForegroundColor Yellow
Write-Host "Backup selected: $resolvedBackup"
$confirmation = Read-Host "Type RESTORE to continue"
if ($confirmation -cne "RESTORE") {
  Write-Host "Restore cancelled. No data was changed."
  exit 0
}

Write-Host "Creating a safety backup first..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "backup-database.ps1") -EnvironmentFile $EnvironmentFile
if ($LASTEXITCODE -ne 0) { throw "Safety backup failed; restore stopped." }

$containerFile = "/tmp/hospitality-restore.dump"
docker cp $resolvedBackup "${containerId}:$containerFile" | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Could not copy the backup into PostgreSQL container." }

docker exec $containerId pg_restore -l $containerFile | Out-Null
if ($LASTEXITCODE -ne 0) { throw "The selected backup is invalid." }

Write-Host "Restoring database..." -ForegroundColor Cyan
docker exec $containerId sh -c "pg_restore -U `$POSTGRES_USER -d `$POSTGRES_DB --clean --if-exists --no-owner --no-privileges '$containerFile'"
$restoreExitCode = $LASTEXITCODE
docker exec $containerId rm -f $containerFile | Out-Null
if ($restoreExitCode -ne 0) { throw "Restore failed. Your safety backup remains in the backups folder." }

docker compose --env-file $EnvironmentFile restart application | Out-Null
Write-Host "Database restored and application restarted." -ForegroundColor Green
