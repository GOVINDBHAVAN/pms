@echo off
echo Stopping PMS Server (port 3001) and Client (port 5173)...

:: Kill processes using port 3001 (server)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 " ^| findstr "LISTENING"') do (
  echo Killing PID %%a on port 3001
  taskkill /PID %%a /F >nul 2>&1
)

:: Kill processes using port 5173 (client / Vite)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 " ^| findstr "LISTENING"') do (
  echo Killing PID %%a on port 5173
  taskkill /PID %%a /F >nul 2>&1
)

:: Also close the console windows opened by dev.bat
taskkill /FI "WINDOWTITLE eq PMS - Server" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq PMS - Client" /F >nul 2>&1

echo Done.
pause
