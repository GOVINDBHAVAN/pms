@echo off
cd /d "%~dp0"
start "PMS - Server" cmd /k "cd /d "%~dp0server" && npm run dev"
start "PMS - Client" cmd /k "cd /d "%~dp0client" && npm run dev"
