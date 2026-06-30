param(
  [string]$Manifest = "tools/audio-sync-preview.json",
  [int]$Timeout = 10
)

$ErrorActionPreference = "Stop"
$env:PYTHONIOENCODING = "utf-8"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Push-Location $ProjectRoot
try {
  if (-not (Test-Path -LiteralPath $Manifest)) {
    throw "Manifest not found. Run tools\sync-audio-to-cloudflare.ps1 with -PublicBaseUrl first."
  }

  python tools\verify_audio_urls.py --manifest $Manifest --timeout $Timeout
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}
finally {
  Pop-Location
}
