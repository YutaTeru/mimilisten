param(
  [string]$Bucket = "mimilisten-audio",
  [string]$PublicBaseUrl = "",
  [string]$SourceRoot = "",
  [int]$MaxMB = 100,
  [int]$MaxFiles = 200,
  [int]$LimitFiles = 0,
  [switch]$RequireLogin,
  [switch]$RequirePublicBaseUrl,
  [switch]$SkipLoginCheck
)

$ErrorActionPreference = "Stop"
$env:PYTHONIOENCODING = "utf-8"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$MaxBytes = $MaxMB * 1024 * 1024

Push-Location $ProjectRoot
try {
  $argsList = @(
    "tools\check_audio_cloudflare_ready.py",
    "--bucket", $Bucket,
    "--limit-files", "$LimitFiles",
    "--max-bytes", "$MaxBytes",
    "--max-files", "$MaxFiles"
  )

  if ($SourceRoot) {
    $argsList += @("--source-root", $SourceRoot)
  }
  if ($PublicBaseUrl) {
    $argsList += @("--public-base-url", $PublicBaseUrl)
  }
  if ($RequireLogin) {
    $argsList += "--require-login"
  }
  if ($RequirePublicBaseUrl) {
    $argsList += "--require-public-base-url"
  }
  if ($SkipLoginCheck) {
    $argsList += "--skip-login-check"
  }

  python @argsList
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}
finally {
  Pop-Location
}
