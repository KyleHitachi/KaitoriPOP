param(
  [string]$TaskName = "KaitoriPOP LAN Server",
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$StartScript = Resolve-Path (Join-Path $ScriptDir "start-kaitoripop.ps1")
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "..\..")

$Action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$StartScript`" -Port $Port" `
  -WorkingDirectory $ProjectRoot

$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Days 0) `
  -MultipleInstances IgnoreNew `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $Action `
  -Trigger $Trigger `
  -Settings $Settings `
  -Description "Starts KaitoriPOP for LAN users at Windows logon." `
  -Force `
  -ErrorAction Stop | Out-Null

Start-ScheduledTask -TaskName $TaskName -ErrorAction Stop

Write-Host "Installed and started scheduled task: $TaskName"
Write-Host "LAN URL: http://<this-pc-ip>:$Port"
