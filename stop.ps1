Write-Host "Stopping PMS Server (port 3001) and Client (port 5173)..." -ForegroundColor Cyan

function Stop-Port {
  param([int]$Port)
  $connections = netstat -aon | Select-String ":$Port\s.*LISTENING"
  foreach ($line in $connections) {
    $pid = ($line -split '\s+')[-1]
    if ($pid -match '^\d+$') {
      try {
        Stop-Process -Id $pid -Force -ErrorAction Stop
        Write-Host "  Killed PID $pid on port $Port" -ForegroundColor Green
      } catch {
        Write-Host "  Could not kill PID $pid`: $_" -ForegroundColor Yellow
      }
    }
  }
}

Stop-Port -Port 3001
Stop-Port -Port 5173

# Also close console windows opened by dev.ps1 / dev.bat
Get-Process | Where-Object { $_.MainWindowTitle -match "PMS - (Server|Client)" } |
  ForEach-Object { $_.Kill(); Write-Host "  Closed window: $($_.MainWindowTitle)" -ForegroundColor Green }

Write-Host "Done." -ForegroundColor Cyan
