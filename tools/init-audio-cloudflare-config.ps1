param(
  [string]$PublicBaseUrl = "",
  [string]$Bucket = "mimilisten-audio",
  [string]$SourceRoot = "",
  [int]$MaxMB = 100,
  [int]$MaxFiles = 200,
  [int]$LimitFiles = 0,
  [string]$Path = "",
  [switch]$Force
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

if (-not $Path) {
  $Path = Join-Path $ProjectRoot "cloudflare\audio-sync.local.json"
} elseif (-not [System.IO.Path]::IsPathRooted($Path)) {
  $Path = Join-Path $ProjectRoot $Path
}

if (-not $SourceRoot) {
  $audioFolderName = -join ([char[]](0x97F3, 0x6E90, 0x96C6))
  $SourceRoot = Join-Path (Join-Path $env:USERPROFILE "Desktop") $audioFolderName
}

if ($PublicBaseUrl -and (-not $PublicBaseUrl.StartsWith("https://") -or $PublicBaseUrl.Contains("<") -or $PublicBaseUrl.Contains(">"))) {
  throw "PublicBaseUrl must be empty or a real https URL."
}

if ((Test-Path -LiteralPath $Path) -and -not $Force) {
  throw "Config already exists: $Path. Use -Force to overwrite it."
}

$parent = Split-Path -Parent $Path
if (-not (Test-Path -LiteralPath $parent)) {
  New-Item -ItemType Directory -Path $parent | Out-Null
}

$config = [ordered]@{
  bucket = $Bucket
  publicBaseUrl = $PublicBaseUrl
  sourceRoot = $SourceRoot
  maxMB = $MaxMB
  maxFiles = $MaxFiles
  limitFiles = $LimitFiles
}

$json = $config | ConvertTo-Json -Depth 3
Set-Content -LiteralPath $Path -Value $json -Encoding UTF8

Write-Host "Wrote audio sync config: $Path" -ForegroundColor Cyan
Write-Host "This local config is ignored by git when saved as cloudflare\audio-sync.local.json." -ForegroundColor Cyan
