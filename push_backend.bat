@echo off
setlocal enabledelayedexpansion

echo ================================================================
echo   1-CLICK PUSH: Farmer Procurement - BACKEND to GitHub
echo ================================================================
echo.

:: Detect git executable
where git >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "GIT_CMD=git"
) else if exist "C:\Program Files\Git\cmd\git.exe" (
    set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"
) else if exist "C:\Program Files (x86)\Git\cmd\git.exe" (
    set "GIT_CMD=C:\Program Files (x86)\Git\cmd\git.exe"
) else if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" (
    set "GIT_CMD=%LOCALAPPDATA%\Programs\Git\cmd\git.exe"
) else (
    echo [ERROR] Git is not found on your system!
    echo Please install Git for Windows from https://git-scm.com/
    pause
    exit /b 1
)

cd /d "%~dp0backend"
echo [1/5] Entering backend directory: %CD%

echo [2/5] Initializing Git repository...
"!GIT_CMD!" init

echo [3/5] Staging files...
"!GIT_CMD!" add .

echo [4/5] Committing changes...
"!GIT_CMD!" commit -m "feat: complete farmer procurement backend API with Neon PostgreSQL and Render config" --allow-empty

"!GIT_CMD!" branch -M main

echo [5/5] Connecting to GitHub remote...
"!GIT_CMD!" remote remove origin >nul 2>&1
"!GIT_CMD!" remote add origin https://github.com/srinidhi6002/farmerprocurementmanagementbackend.git

echo.
echo Pushing code to https://github.com/srinidhi6002/farmerprocurementmanagementbackend.git ...
echo (If a GitHub sign-in prompt appears, please approve or log in)
echo.

"!GIT_CMD!" push -u origin main --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================
    echo   SUCCESS: BACKEND REPOSITORY HAS BEEN PUSHED TO GITHUB!
    echo   Link: https://github.com/srinidhi6002/farmerprocurementmanagementbackend
    echo ================================================================
) else (
    echo.
    echo ----------------------------------------------------------------
    echo Trying fallback repository name: FarmerProcurement-Backend ...
    echo ----------------------------------------------------------------
    "!GIT_CMD!" remote set-url origin https://github.com/srinidhi6002/FarmerProcurement-Backend.git
    "!GIT_CMD!" push -u origin main --force
    if !ERRORLEVEL! EQU 0 (
        echo.
        echo ================================================================
        echo   SUCCESS: BACKEND REPOSITORY HAS BEEN PUSHED TO GITHUB!
        echo   Link: https://github.com/srinidhi6002/FarmerProcurement-Backend
        echo ================================================================
    ) else (
        echo.
        echo [ERROR] Push failed. Please verify the backend repository name on GitHub.
    )
)

echo.
pause
