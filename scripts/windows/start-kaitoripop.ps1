param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$LogDir = Join-Path $ProjectRoot "logs"
$OutLog = Join-Path $LogDir "kaitoripop.out.log"
$ErrLog = Join-Path $LogDir "kaitoripop.err.log"
$NextCmd = Join-Path $ProjectRoot "node_modules\.bin\next.cmd"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

if (-not (Test-Path $NextCmd)) {
  throw "next.cmd was not found. Run npm install in $ProjectRoot first."
}

Set-Location $ProjectRoot
$env:NODE_ENV = "production"

& $NextCmd start -H 0.0.0.0 -p $Port 1>> $OutLog 2>> $ErrLog
