param(
  [string]$OutputDir = "dist"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$OutputPath = if ([System.IO.Path]::IsPathRooted($OutputDir)) {
  [System.IO.Path]::GetFullPath($OutputDir)
} else {
  [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot $OutputDir))
}
$ProjectFullPath = [System.IO.Path]::GetFullPath($ProjectRoot)

if (-not $OutputPath.StartsWith($ProjectFullPath, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "OutputDir must be inside the project folder: $OutputPath"
}

$OutputLeaf = Split-Path -Leaf $OutputPath
if ($OutputLeaf -ne "dist") {
  throw "For safety, OutputDir must be named dist: $OutputPath"
}

if (Test-Path -LiteralPath $OutputPath) {
  Remove-Item -LiteralPath $OutputPath -Recurse -Force
}
New-Item -ItemType Directory -Path $OutputPath | Out-Null

$items = @(
  "index.html",
  "app.js",
  "styles.css",
  "manifest.webmanifest",
  "data",
  "assets"
)

foreach ($item in $items) {
  $source = Join-Path $ProjectRoot $item
  if (-not (Test-Path -LiteralPath $source)) {
    throw "Required app file or folder is missing: $item"
  }
  Copy-Item -LiteralPath $source -Destination (Join-Path $OutputPath $item) -Recurse -Force
}

@"
/data/*.json
  Cache-Control: no-cache

/*.html
  Cache-Control: no-cache

/*.js
  Cache-Control: public, max-age=300

/*.css
  Cache-Control: public, max-age=300

/assets/*
  Cache-Control: public, max-age=604800
"@ | Set-Content -LiteralPath (Join-Path $OutputPath "_headers") -Encoding UTF8

"/* /index.html 200" | Set-Content -LiteralPath (Join-Path $OutputPath "_redirects") -Encoding UTF8

$required = @(
  "index.html",
  "app.js",
  "styles.css",
  "data\questions.json",
  "data\long-listening.json",
  "assets\guardians\dawnfang.png"
)

foreach ($item in $required) {
  $path = Join-Path $OutputPath $item
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Dist verification failed. Missing: $item"
  }
}

Write-Host "Built Cloudflare Pages dist: $OutputPath" -ForegroundColor Green
