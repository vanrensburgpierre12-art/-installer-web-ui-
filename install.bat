@echo off
REM Vehicle Installation Tracker - Windows Install Script
REM This script automates the installation process on Windows

setlocal enabledelayedexpansion

echo ==========================================
echo Vehicle Installation Tracker - Installer
echo ==========================================
echo.

REM Check if we're in the right directory
if not exist "docker-compose.yml" (
    echo [ERROR] Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check if Docker is installed
echo [INFO] Checking if Docker is installed...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    echo After installation, restart your computer and run this script again
    pause
    exit /b 1
)

echo [SUCCESS] Docker is installed

REM Check if Docker Compose is available
echo [INFO] Checking Docker Compose...
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not available
    echo Please update Docker Desktop to the latest version
    pause
    exit /b 1
)

echo [SUCCESS] Docker Compose is available

REM Setup environment file
echo [INFO] Setting up environment configuration...
if not exist ".env" (
    copy .env.example .env
    echo [SUCCESS] Environment file created from template
) else (
    echo [WARNING] Environment file already exists, skipping creation
)

REM Generate secure passwords if needed
findstr /C:"DB_PASSWORD=your_secure_password_here" .env >nul
if %errorlevel% equ 0 (
    echo [INFO] Generating secure passwords...
    
    REM Generate random passwords (simple approach for Windows)
    set /a "RAND1=%RANDOM%"
    set /a "RAND2=%RANDOM%"
    set /a "RAND3=%RANDOM%"
    
    REM Update .env file with generated passwords
    powershell -Command "(Get-Content .env) -replace 'DB_PASSWORD=your_secure_password_here', 'DB_PASSWORD=secure_password_%RAND1%_%RAND2%' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long', 'JWT_SECRET=jwt_secret_%RAND1%_%RAND2%_%RAND3%' | Set-Content .env"
    
    echo [SUCCESS] Secure passwords generated and configured
) else (
    echo [INFO] Environment file already configured
)

REM Ask user for installation mode
echo.
echo Choose installation mode:
echo 1) Development mode (recommended for first-time setup)
echo 2) Production mode
echo.
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo [INFO] Starting in development mode...
    docker-compose -f docker-compose.dev.yml up --build -d
) else if "%choice%"=="2" (
    echo [INFO] Starting in production mode...
    docker-compose up --build -d
) else (
    echo [WARNING] Invalid choice. Starting in development mode...
    docker-compose -f docker-compose.dev.yml up --build -d
)

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start the application
    echo Please check Docker Desktop is running and try again
    pause
    exit /b 1
)

echo [SUCCESS] Application started successfully

REM Wait for services to start
echo [INFO] Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Check if services are running
echo [INFO] Checking service status...
docker-compose ps

REM Try to create admin user
echo [INFO] Creating admin user...
curl -s -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"email\":\"admin@example.com\",\"password\":\"admin123\",\"firstName\":\"Admin\",\"lastName\":\"User\",\"role\":\"admin\"}" >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Admin user created successfully
) else (
    echo [WARNING] Failed to create admin user automatically. You can create it manually later.
)

REM Display final information
echo.
echo ==========================================
echo [SUCCESS] Installation completed successfully!
echo ==========================================
echo.
echo Application URLs:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:5000
echo   Database: localhost:5432
echo.
echo Default Login Credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo Important:
echo   - Change the default password after first login
echo   - Review the .env file for security settings
echo   - Check the README.md for detailed usage instructions
echo.
echo Useful Commands:
echo   View logs: docker-compose logs -f
echo   Stop app: docker-compose down
echo   Start app: docker-compose up -d
echo   Restart app: docker-compose restart
echo.

REM Try to open browser
echo [INFO] Opening application in your default browser...
start http://localhost:3000

echo.
echo Press any key to exit...
pause >nul