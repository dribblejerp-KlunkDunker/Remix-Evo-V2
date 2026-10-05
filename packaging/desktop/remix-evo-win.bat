@echo off
title Remix Evo - Autonomous Agent Matrix
echo ========================================================
echo   Remix Evo: Autonomous Agent Skills Matrix (Desktop)
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your laptop.
    echo Please download and install Node.js 20 or 22 from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

if not exist .env (
    if exist .env.example (
        echo Creating local .env configuration...
        copy .env.example .env >nul
    )
)

if not exist node_modules (
    echo Installing dependencies for your laptop...
    call npm install
)

echo Starting Remix Evo Autonomous Matrix...
start http://localhost:3000
call npm run dev
pause
