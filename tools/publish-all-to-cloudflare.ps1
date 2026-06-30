param(
  [string]$ProjectName = "mimilisten",
  [string]$Branch = "main",
  [string]$Config = "cloudflare\audio-sync.local.json",
  [switch]$SmallTest,
  [switch]$SkipAudio
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$AudioScript = Join-Path $ProjectRoot "tools\publish-audio-to-cloudflare.ps1"
$DeployScript = Join-Path $ProjectRoot "tools\deploy-app-to-cloudflare.ps1"

Push-Location $ProjectRoot
try {
  if (-not $SkipAudio) {
    $audioParams = @{
      Config = $Config
      Upload = $true
      UpdateJson = $true
      Verify = $true
    }
    if (-not $SmallTest) {
      $audioParams.Full = $true
    }

    Write-Host "Step 1/2: sync audio to Cloudflare R2 and update app JSON" -ForegroundColor Cyan
    & $AudioScript @audioParams
    if (-not $?) {
      exit 1
    }
  }

  Write-Host "Step 2/2: deploy app text/data/assets to Cloudflare Pages" -ForegroundColor Cyan
  & $DeployScript -ProjectName $ProjectName -Branch $Branch
  if (-not $?) {
    exit 1
  }
}
finally {
  Pop-Location
}
