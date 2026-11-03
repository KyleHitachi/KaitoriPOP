param(
  [string]$TaskName = "KaitoriPOP LAN Server",
  [int]$Port = 3000
)

$Task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($Task) {
  $Info = Get-ScheduledTaskInfo -TaskName $TaskName
  Write-Host "Task: $TaskName"
  Write-Host "State: $($Task.State)"
  Write-Host "LastRunTime: $($Info.LastRunTime)"
  Write-Host "LastTaskResult: $($Info.LastTaskResult)"
} else {
  Write-Host "Task not installed: $TaskName"
}

$Connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($Connections) {
  Write-Host "Port $Port is listening or active:"
  $Connections | Select-Object LocalAddress,LocalPort,State,OwningProcess | Format-Table
} else {
  Write-Host "Port $Port is not active."
}
