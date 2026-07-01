param(
  [string]$BackupDir = "tools/audio-json-backups",
  [string]$BackupName = "",
  [switch]$Restore
)

$ErrorActionPreference = "Stop"
$env:PYTHONIOENCODING = "utf-8"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Push-Location $ProjectRoot
try {
  $argsList = @(
    "tools\restore_audio_json_backup.py",
    "--backup-dir", $BackupDir
  )

  if ($BackupName) {
    $argsList += @("--backup-name", $BackupName)
  }
  if (-not $Restore) {
    $argsList += "--dry-run"
    Write-Host "DRY RUN: no JSON files will be restored. Add -Restore to write files." -ForegroundColor Cyan
  }

  python @argsList
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}
finally {
  Pop-Location
}
