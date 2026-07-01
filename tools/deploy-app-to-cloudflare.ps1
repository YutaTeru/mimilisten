param(
  [string]$ProjectName = "mimilisten",
  [string]$Branch = "main",
  [string]$OutputDir = "dist",
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$BuildScript = Join-Path $ProjectRoot "tools\build-pages-dist.ps1"
$OutputPath = if ([System.IO.Path]::IsPathRooted($OutputDir)) {
  [System.IO.Path]::GetFullPath($OutputDir)
} else {
  [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot $OutputDir))
}

Push-Location $ProjectRoot
try {
  if (-not $SkipBuild) {
    & $BuildScript -OutputDir $OutputDir
    if (-not $?) {
      exit 1
    }
  }

  $projectsJson = & npx.cmd --yes wrangler pages project list --json
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
  $projects = $projectsJson | ConvertFrom-Json
  $exists = $false
  foreach ($project in $projects) {
    $name = $project.name
    if (-not $name) {
      $name = $project."Project Name"
    }
    if ($name -eq $ProjectName) {
      $exists = $true
    }
  }

  if (-not $exists) {
    Write-Host "Creating Cloudflare Pages project: $ProjectName" -ForegroundColor Cyan
    & npx.cmd --yes wrangler pages project create $ProjectName --production-branch $Branch
    if ($LASTEXITCODE -ne 0) {
      exit $LASTEXITCODE
    }
  }

  $commitHash = (& git rev-parse --short HEAD 2>$null)
  $commitMessage = (& git log -1 --pretty=%s 2>$null)

  Write-Host "Deploying app to Cloudflare Pages project '$ProjectName' from $OutputPath" -ForegroundColor Cyan
  & npx.cmd --yes wrangler pages deploy $OutputPath --project-name $ProjectName --branch $Branch --commit-hash $commitHash --commit-message $commitMessage --commit-dirty=true
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}
finally {
  Pop-Location
}
