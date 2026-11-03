param(
  [string]$TaskName = "KaitoriPOP LAN Server"
)

$ErrorActionPreference = "Stop"

$Task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if (-not $Task) {
  Write-Host "Scheduled task not found: $TaskName"
  exit 0
}

Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false

Write-Host "Uninstalled scheduled task: $TaskName"
