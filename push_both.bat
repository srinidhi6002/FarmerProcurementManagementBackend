@echo off
setlocal enabledelayedexpansion

echo ================================================================
echo   1-CLICK PUSH: BOTH FRONTEND & BACKEND TO GITHUB
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

echo ----------------------------------------------------------------
echo [STEP 1/2] Pushing FRONTEND to https://github.com/srinidhi6002/farmerprocurementmanagementfrontend.git
echo ----------------------------------------------------------------
cd /d "%~dp0frontend"
"!GIT_CMD!" init
"!GIT_CMD!" add .
"!GIT_CMD!" commit -m "feat: complete farmer procurement frontend with full validation and modern UI" --allow-empty
"!GIT_CMD!" branch -M main
"!GIT_CMD!" remote remove origin >nul 2>&1
"!GIT_CMD!" remote add origin https://github.com/srinidhi6002/farmerprocurementmanagementfrontend.git
"!GIT_CMD!" push -u origin main --force

echo.
echo ----------------------------------------------------------------
echo [STEP 2/2] Pushing BACKEND to https://github.com/srinidhi6002/farmerprocurementmanagementbackend.git
echo ----------------------------------------------------------------
cd /d "%~dp0backend"
"!GIT_CMD!" init
"!GIT_CMD!" add .
"!GIT_CMD!" commit -m "feat: complete farmer procurement backend API with Neon PostgreSQL and Render config" --allow-empty
"!GIT_CMD!" branch -M main
"!GIT_CMD!" remote remove origin >nul 2>&1
"!GIT_CMD!" remote add origin https://github.com/srinidhi6002/farmerprocurementmanagementbackend.git
"!GIT_CMD!" push -u origin main --force
if !ERRORLEVEL! NEQ 0 (
    echo Trying fallback repository name: FarmerProcurement-Backend ...
    "!GIT_CMD!" remote set-url origin https://github.com/srinidhi6002/FarmerProcurement-Backend.git
    "!GIT_CMD!" push -u origin main --force
)

echo.
echo ================================================================
echo   ALL DONE! Check output above for both repositories.
echo ================================================================
echo.
pause
