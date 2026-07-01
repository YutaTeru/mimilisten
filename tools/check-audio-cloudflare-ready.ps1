param(
  [string]$Bucket = "mimilisten-audio",
  [string]$PublicBaseUrl = "",
  [string]$SourceRoot = "",
  [string]$Config = "",
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
$DefaultConfigPath = Join-Path $ProjectRoot "cloudflare\audio-sync.local.json"
$ConfigPath = $null
if ($Config) {
  if ([System.IO.Path]::IsPathRooted($Config)) {
    $ConfigPath = $Config
  } else {
    $ConfigPath = Join-Path $ProjectRoot $Config
  }
} elseif (Test-Path -LiteralPath $DefaultConfigPath) {
  $ConfigPath = $DefaultConfigPath
}

if ($ConfigPath) {
  if (-not (Test-Path -LiteralPath $ConfigPath)) {
    throw "Config file not found: $ConfigPath"
  }
  $ConfigData = Get-Content -Raw -Encoding UTF8 -LiteralPath $ConfigPath | ConvertFrom-Json
  if (-not $PSBoundParameters.ContainsKey("Bucket") -and $ConfigData.bucket) {
    $Bucket = [string]$ConfigData.bucket
  }
  if (-not $PSBoundParameters.ContainsKey("PublicBaseUrl") -and $ConfigData.publicBaseUrl) {
    $PublicBaseUrl = [string]$ConfigData.publicBaseUrl
  }
  if (-not $PSBoundParameters.ContainsKey("SourceRoot") -and $ConfigData.sourceRoot) {
    $SourceRoot = [string]$ConfigData.sourceRoot
  }
  if (-not $PSBoundParameters.ContainsKey("MaxMB") -and $null -ne $ConfigData.maxMB) {
    $MaxMB = [int]$ConfigData.maxMB
  }
  if (-not $PSBoundParameters.ContainsKey("MaxFiles") -and $null -ne $ConfigData.maxFiles) {
    $MaxFiles = [int]$ConfigData.maxFiles
  }
  if (-not $PSBoundParameters.ContainsKey("LimitFiles") -and $null -ne $ConfigData.limitFiles) {
    $LimitFiles = [int]$ConfigData.limitFiles
  }
  Write-Host "Using audio sync config: $ConfigPath" -ForegroundColor Cyan
}

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
