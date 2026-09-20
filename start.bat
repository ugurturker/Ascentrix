@echo off
cd /d "%~dp0"
echo ========================================
echo  Ascentrix - Site Baslatiliyor
echo  http://localhost:4173
echo ========================================
echo.
npm run preview -- --port 4173 --host --open
pause
