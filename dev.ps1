$root = $PSScriptRoot
Write-Host "Starting PMS Server (port 3001) and Client (port 5173)..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/k `"cd /d $root\server && npm run dev`""
Start-Process cmd -ArgumentList "/k `"cd /d $root\client && npm run dev`""
