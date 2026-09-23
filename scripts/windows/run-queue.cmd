@echo off
powershell.exe -NoProfile -Command "if (Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'php.exe' -and $_.CommandLine -match 'artisan queue:work' }) { exit 0 } else { exit 1 }"
if %errorlevel% equ 0 exit /b 0
cd /d "%~dp0..\..\apps\api"
"C:\xampp\php\php.exe" artisan queue:work --sleep=3 --tries=3 >> storage\logs\queue-worker.log 2>&1
