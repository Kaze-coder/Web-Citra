@echo off
powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if %errorlevel% equ 0 exit /b 0
cd /d "%~dp0..\..\apps\api"
"C:\xampp\php\php.exe" artisan serve --host=127.0.0.1 --port=8000 >> storage\logs\api-server.log 2>&1
