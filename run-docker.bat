@echo off
:: Quick run script for AI-Assisted RDF Graph Explorer Docker container

setlocal enabledelayedexpansion

:: Configuration
set "IMAGE_NAME=rdf-explorer"
set "IMAGE_TAG=local"
set "FULL_IMAGE_NAME=%IMAGE_NAME%:%IMAGE_TAG%"
set "CONTAINER_NAME=rdf-explorer"
set "PORT=8081"

echo Starting AI-Assisted RDF Graph Explorer...

:: Check if Docker Desktop is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Desktop is not running or not in PATH
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

:: Check if image exists, if not build it
echo Checking for Docker image...
docker images %FULL_IMAGE_NAME% --format "{{.Repository}}:{{.Tag}}" | findstr "%FULL_IMAGE_NAME%" >nul
if %errorlevel% neq 0 (
    echo [INFO] Image not found. Building %FULL_IMAGE_NAME%...
    echo.
    call :build_image
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to build image
        pause
        exit /b 1
    )
    echo [OK] Image built successfully!
) else (
    echo [OK] Found existing image %FULL_IMAGE_NAME%
    :: Verify the image contains built production assets (assets folder). If not, rebuild.
    set "ASSET_CHECK="
    for /f "delims=" %%A in ('docker run --rm %FULL_IMAGE_NAME% sh -c "if [ -d /usr/share/nginx/html/assets ]; then echo ASSETS_OK; else echo ASSETS_MISSING; fi" 2^>nul') do set "ASSET_CHECK=%%A"
    if "%ASSET_CHECK%"=="ASSETS_MISSING" (
        echo [WARNING] Existing image is missing built assets; rebuilding image to include production bundle...
        call :build_image
        if %errorlevel% neq 0 (
            echo [ERROR] Failed to build image
            pause
            exit /b 1
        )
        echo [OK] Image rebuilt successfully!
    ) else (
        echo [OK] Image contains built assets.
    )
)

:: Stop and remove existing container
echo Stopping existing container...
docker stop %CONTAINER_NAME% >nul 2>&1
docker rm %CONTAINER_NAME% >nul 2>&1

:: Check if API key is provided
if "%~1"=="" (
    if defined GEMINI_API_KEY (
        set "API_KEY=!GEMINI_API_KEY!"
        echo [OK] Using API key from environment variable
    ) else (
        echo [WARNING] No API key provided - AI features will be disabled
        echo To use AI features, run: run-docker.bat your_gemini_api_key
        set "API_KEY="
    )
) else (
    set "API_KEY=%~1"
    echo [OK] Using provided API key
)

:: Run container
echo Starting container...
if defined API_KEY (
    docker run -d --name %CONTAINER_NAME% -p %PORT%:80 -e GEMINI_API_KEY=!API_KEY! %FULL_IMAGE_NAME%
) else (
    docker run -d --name %CONTAINER_NAME% -p %PORT%:80 %FULL_IMAGE_NAME%
)

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start container
    echo.
    echo Troubleshooting tips:
    echo 1. Check if Docker Desktop is running properly
    echo 2. Verify the image exists: docker images %FULL_IMAGE_NAME%
    echo 3. Check if port %PORT% is already in use
    pause
    exit /b 1
)

echo [OK] Container started successfully!
echo.

:: Wait for container to initialize
echo Waiting for application to start...
timeout /t 3 /nobreak >nul

:: Check if container is running
echo Container status:
docker ps --filter "name=%CONTAINER_NAME%" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

:: Test health endpoint
echo Testing health...
timeout /t 2 /nobreak >nul
curl -s http://localhost:%PORT%/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Application is healthy and ready!
) else (
    echo [WARNING] Health check failed - application may still be starting
    echo Waiting a bit longer...
    timeout /t 5 /nobreak >nul
    curl -s http://localhost:%PORT%/health >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Application is now healthy and ready!
    ) else (
        echo [WARNING] Health check failed - check logs with: docker logs %CONTAINER_NAME%
    )
)

echo.
echo =====================================
echo Application accessible at:
echo http://localhost:%PORT%
echo =====================================
echo.
echo Useful commands:
echo   View logs: docker logs %CONTAINER_NAME%
echo   Stop:      docker stop %CONTAINER_NAME%
echo   Restart:   docker restart %CONTAINER_NAME%
echo.

goto :eof

:build_image
echo.
echo ================================================
echo Building AI-Assisted RDF Graph Explorer Docker Image
echo ================================================
echo.

:: Check if we're in correct directory
if not exist "package.json" (
    echo [ERROR] package.json not found. Please run this script from the project root directory
    exit /b 1
)

if not exist "Dockerfile" (
    echo [ERROR] Dockerfile not found. Please run this script from the project root directory
    exit /b 1
)

:: Clean up any existing image
echo Cleaning up existing images...
docker rmi %FULL_IMAGE_NAME% >nul 2>&1

:: Build the image
echo Building %FULL_IMAGE_NAME%...
docker build -t %FULL_IMAGE_NAME% --progress=plain .
if %errorlevel% neq 0 (
    exit /b 1
)

echo.
exit /b 0