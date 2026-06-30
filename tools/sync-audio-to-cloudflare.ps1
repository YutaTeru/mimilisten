param(
  [string]$Bucket = "mimilisten-audio",
  [string]$PublicBaseUrl = "",
  [string]$SourceRoot = "",
  [switch]$SetupBucket,
  [switch]$Upload,
  [switch]$UpdateJson,
  [switch]$SetCors,
  [switch]$EnableR2DevUrl,
  [int]$MaxMB = 100
)

$ErrorActionPreference = "Stop"
$env:PYTHONIOENCODING = "utf-8"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
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
    "--max-bytes", "$MaxBytes",
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
  if ($Upload) {
    $argsList += "--upload"
  }

  if (-not $Upload) {
    Write-Host "DRY RUN: no Cloudflare changes will be made." -ForegroundColor Cyan
  } else {
    Write-Host "UPLOAD: sending files to Cloudflare R2. Safety limit: MaxMB=$MaxMB." -ForegroundColor Yellow
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
}
finally {
  Pop-Location
}
