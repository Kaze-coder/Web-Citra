@echo off
powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if %errorlevel% equ 0 exit /b 0
cd /d "%~dp0..\..\apps\web"
"C:\Program Files\nodejs\npm.cmd" start -- --hostname 127.0.0.1 --port 3100 >> web-server.log 2>&1
