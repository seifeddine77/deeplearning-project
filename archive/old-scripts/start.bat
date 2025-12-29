@echo off
REM Deep Learning CNN+LSTM Project - Quick Start Script

echo.
echo ========================================
echo Deep Learning CNN+LSTM Project
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting server on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

call npm start
pause
