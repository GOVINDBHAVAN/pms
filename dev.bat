@echo off
echo Starting PMS Server (port 3001) and Client (port 5173)...
start "PMS - Server" cmd /k "cd /d %~dp0server && npm run dev"
start "PMS - Client" cmd /k "cd /d %~dp0client && npm run dev"
