param(
  [string]$Config = "",
  [string]$Bucket = "",
  [string]$PublicBaseUrl = "",
  [string]$SourceRoot = "",
  [int]$MaxMB = 0,
  [int]$MaxFiles = 0,
  [int]$LimitFiles = -1,
  [switch]$Full,
  [switch]$Upload,
  [switch]$UpdateJson,
  [switch]$SetupBucket,
  [switch]$SetCors,
  [switch]$EnableR2DevUrl,
  [switch]$SkipLoginCheck
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$CheckScript = Join-Path $ProjectRoot "tools\check-audio-cloudflare-ready.ps1"
$SyncScript = Join-Path $ProjectRoot "tools\sync-audio-to-cloudflare.ps1"

if ($Full) {
  $EffectiveLimitFiles = 0
} elseif ($LimitFiles -ge 0) {
  $EffectiveLimitFiles = $LimitFiles
} else {
  $EffectiveLimitFiles = 3
}

$sharedParams = @{}
if ($Config) {
  $sharedParams.Config = $Config
}
if ($Bucket) {
  $sharedParams.Bucket = $Bucket
}
if ($PublicBaseUrl) {
  $sharedParams.PublicBaseUrl = $PublicBaseUrl
}
if ($SourceRoot) {
  $sharedParams.SourceRoot = $SourceRoot
}
if ($MaxMB -gt 0) {
  $sharedParams.MaxMB = $MaxMB
}
if ($MaxFiles -gt 0) {
  $sharedParams.MaxFiles = $MaxFiles
}
$sharedParams.LimitFiles = $EffectiveLimitFiles

$checkParams = [hashtable]$sharedParams.Clone()
if ($Upload) {
  $checkParams.RequireLogin = $true
  $checkParams.RequirePublicBaseUrl = $true
} elseif ($SkipLoginCheck) {
  $checkParams.SkipLoginCheck = $true
}

Write-Host "Step 1/2: readiness check" -ForegroundColor Cyan
& $CheckScript @checkParams
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

$syncParams = [hashtable]$sharedParams.Clone()
if ($SetupBucket) {
  $syncParams.SetupBucket = $true
}
if ($SetCors) {
  $syncParams.SetCors = $true
}
if ($EnableR2DevUrl) {
  $syncParams.EnableR2DevUrl = $true
}
if ($Upload) {
  $syncParams.Upload = $true
}
if ($UpdateJson) {
  $syncParams.UpdateJson = $true
}

Write-Host "Step 2/2: audio sync" -ForegroundColor Cyan
& $SyncScript @syncParams
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
