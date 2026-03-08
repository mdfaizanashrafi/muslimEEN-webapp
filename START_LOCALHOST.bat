@echo off
chcp 65001 >nul
echo.
echo ======================================
echo   🌙 Starting MuslimEEN on localhost
echo ======================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Backend Server...
start "MuslimEEN Backend" cmd /k "cd backend && node dist/server.js"

echo [2/3] Waiting for backend (10 seconds)...
timeout /t 10 /nobreak >nul

echo [3/3] Starting Frontend Server...
start "MuslimEEN Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ======================================
echo   ✅ Servers Started!
echo ======================================
echo.
echo Backend API:    http://localhost:3001
echo Frontend App:   http://localhost:8080
echo API Docs:       http://localhost:3001/api-docs
echo Health Check:   http://localhost:3001/health
echo.
echo To stop servers, close the command windows.
echo.
pause
