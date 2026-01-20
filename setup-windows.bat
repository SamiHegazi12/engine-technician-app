@echo off
echo ========================================
echo Engine Technician App - Setup Script
echo ========================================
echo.

echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js is installed.
echo.

echo [2/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo Dependencies installed successfully.
echo.

echo [3/5] Building the project...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo Build completed successfully.
echo.

echo [4/5] Checking Git installation...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Git is not installed!
    echo You'll need Git to push to GitHub.
    echo Download from https://git-scm.com/
) else (
    echo Git is installed.
)
echo.

echo [5/5] Setup complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Test locally: npm run dev
echo 2. Push to GitHub: git add . && git commit -m "Reconstruct project" && git push
echo 3. Vercel will automatically deploy
echo.
echo For detailed instructions, see DEPLOYMENT_GUIDE.md
echo ========================================
pause
