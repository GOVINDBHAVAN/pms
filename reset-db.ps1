$dbPath = "$PSScriptRoot\data\pms.db"
if (Test-Path $dbPath) {
    Remove-Item $dbPath -Force
    Write-Host "Deleted $dbPath" -ForegroundColor Yellow
} else {
    Write-Host "No database found at $dbPath" -ForegroundColor Gray
}
Write-Host "Database will be recreated with seed data on next server start." -ForegroundColor Cyan
Write-Host "Run .\dev.ps1 to start the server." -ForegroundColor Green
