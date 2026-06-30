param(
  [string]$Bucket = "mimilisten-audio",
  [string]$PublicBaseUrl = "",
  [string]$SourceRoot = "",
  [string]$Config = "",
  [switch]$SetupBucket,
  [switch]$Upload,
  [switch]$UpdateJson,
  [switch]$AllowJsonOnly,
  [switch]$SetCors,
  [switch]$EnableR2DevUrl,
  [int]$MaxMB = 100,
  [int]$MaxFiles = 200,
  [int]$LimitFiles = 0,
  [string]$BackupJsonDir = "",
  [switch]$NoJsonBackup
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

$ManifestPath = "tools/audio-sync-preview.json"
$MaxBytes = $MaxMB * 1024 * 1024
$NeedsCloudflareAuth = $Upload -or $SetupBucket -or $EnableR2DevUrl -or $SetCors

Push-Location $ProjectRoot
try {
  if ($SourceRoot -and -not (Test-Path -LiteralPath $SourceRoot)) {
    throw "Audio source folder not found: $SourceRoot"
  }

  $argsList = @(
    "tools\sync_audio_to_cloudflare.py",
    "--bucket", $Bucket,
    "--limit-files", "$LimitFiles",
    "--max-bytes", "$MaxBytes",
    "--max-files", "$MaxFiles",
    "--write-manifest", $ManifestPath
  )

  if ($SourceRoot) {
    $argsList += @("--source-root", $SourceRoot)
  }
  if ($PublicBaseUrl) {
    $argsList += @("--public-base-url", $PublicBaseUrl)
  }
  if ($SetupBucket) {
    $argsList += "--create-bucket"
  }
  if ($EnableR2DevUrl) {
    $argsList += "--enable-r2-dev-url"
  }
  if ($SetCors) {
    $argsList += "--set-cors"
  }
  if ($UpdateJson) {
    if (-not $PublicBaseUrl) {
      throw "-UpdateJson requires -PublicBaseUrl."
    }
    $argsList += "--update-json"
  }
  if ($AllowJsonOnly) {
    $argsList += "--allow-json-only"
  }
  if ($BackupJsonDir) {
    $argsList += @("--backup-json-dir", $BackupJsonDir)
  }
  if ($NoJsonBackup) {
    $argsList += "--no-json-backup"
  }
  if ($Upload) {
    $argsList += "--upload"
  }

  if (-not $Upload) {
    Write-Host "DRY RUN: no Cloudflare changes will be made." -ForegroundColor Cyan
  } else {
    Write-Host "UPLOAD: sending files to Cloudflare R2. Safety limits: LimitFiles=$LimitFiles MaxFiles=$MaxFiles MaxMB=$MaxMB." -ForegroundColor Yellow
  }

  if ($NeedsCloudflareAuth) {
    Write-Host "Checking Cloudflare Wrangler login..." -ForegroundColor Cyan
    $whoami = & npx.cmd --yes wrangler whoami 2>&1
    if ($LASTEXITCODE -ne 0 -or ($whoami -join "`n") -match "not authenticated") {
      Write-Host ($whoami -join "`n")
      throw "Cloudflare Wrangler is not logged in. Run: npx.cmd --yes wrangler login"
    }
  }

  python @argsList
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}
finally {
  Pop-Location
}
