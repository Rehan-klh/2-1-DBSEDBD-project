@echo off
title Hostel & Mess Management System

echo ==========================================
echo   HOSTEL ^& MESS MANAGEMENT SYSTEM
echo ==========================================
echo.

rem Initialize .env from .env.example if missing
if not exist "%~dp0.env" (
    if exist "%~dp0.env.example" (
        echo [.env configuration not found - initializing from .env.example]
        copy "%~dp0.env.example" "%~dp0.env" >nul
        echo [.env initialized successfully]
        echo.
    )
)

echo Starting backend and frontend...
echo.

start "Hostel Backend" cmd /k "cd /d "%~dp0" && python -m uvicorn backend.app.main:app --reload"

timeout /t 2 /nobreak >nul

start "Hostel Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo ==========================================
echo   Backend  : http://localhost:8000
echo   API Docs : http://localhost:8000/docs
echo   Frontend : http://localhost:5173
echo ==========================================
echo.
echo Startup commands launched successfully.
echo.
pause