param(
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Push-Location $ProjectRoot
try {
  if (-not $SkipBuild) {
    npm.cmd run build
    if ($LASTEXITCODE -ne 0) {
      exit $LASTEXITCODE
    }
  }

  npx.cmd --yes wrangler deploy
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}
finally {
  Pop-Location
}
