@echo off
REM Build script for Chrome Web Store upload (Windows version)
REM This script builds the extension and creates a folder ready for Chrome Web Store upload

echo 🚀 Starting Chrome Web Store build process...

REM Check if we're in production environment
echo 🔍 Checking environment configuration...

REM Check ENV in textClassifierServer.js
findstr /C:"export const ENV = 'production';" src\contentScript\textClassifierServer.js >nul
if errorlevel 1 (
    echo ❌ Error: ENV is not set to 'production' in src\contentScript\textClassifierServer.js
    echo    Current setting in textClassifierServer.js:
    findstr "export const ENV" src\contentScript\textClassifierServer.js
    if errorlevel 1 echo    No ENV found in textClassifierServer.js
    echo    Please set ENV = 'production' in src\contentScript\textClassifierServer.js for production builds
    exit /b 1
)

REM Check MOCK_CLASSIFICATION_API_CALL in textClassifierServer.js
findstr /C:"export const MOCK_CLASSIFICATION_API_CALL = false;" src\contentScript\textClassifierServer.js >nul
if errorlevel 1 (
    echo ❌ Error: MOCK_CLASSIFICATION_API_CALL is not set to 'false' in src\contentScript\textClassifierServer.js
    echo    Current setting in textClassifierServer.js:
    findstr "export const MOCK_CLASSIFICATION_API_CALL" src\contentScript\textClassifierServer.js
    if errorlevel 1 echo    No MOCK_CLASSIFICATION_API_CALL found in textClassifierServer.js
    echo    Please set MOCK_CLASSIFICATION_API_CALL = false in src\contentScript\textClassifierServer.js for production builds
    exit /b 1
)

REM Check logging level in logger.js
echo 🔍 Checking logging configuration...
findstr /C:"let currentLevel = 'error';" src\logger.js >nul
if errorlevel 1 (
    echo ❌ Error: Logging level is not set to 'error' in src\logger.js
    echo    Current setting in logger.js:
    findstr "let currentLevel =" src\logger.js
    if errorlevel 1 echo    No currentLevel found in logger.js
    echo    Please set currentLevel = 'error' in src\logger.js for production builds
    exit /b 1
)

echo ✅ Environment and logging checks passed!
echo.

REM Define build directory name
set BUILD_DIR=chrome-store-build
set EXTENSION_NAME=youtube-watch-guard

REM Clean up any existing build directory
if exist "%BUILD_DIR%" (
    echo 🧹 Cleaning up existing build directory...
    rmdir /s /q "%BUILD_DIR%"
)

REM Create build directory
echo 📁 Creating build directory...
mkdir "%BUILD_DIR%"

REM Run build commands
echo 🔨 Running build commands...

echo   📦 Building CSS...
call npm run build:css
if errorlevel 1 (
    echo ❌ CSS build failed!
    exit /b 1
)

echo   📦 Building content script...
call npm run build:content
if errorlevel 1 (
    echo ❌ Content build failed!
    exit /b 1
)

echo ✅ Build commands completed successfully!

REM Copy required folders
echo 📋 Copying required folders...

echo   📁 Copying dist folder...
xcopy /e /i /y dist "%BUILD_DIR%\dist"

echo   📁 Copying images folder...
xcopy /e /i /y images "%BUILD_DIR%\images"

echo   📁 Copying src folder...
xcopy /e /i /y src "%BUILD_DIR%\src"

REM Copy required root files
echo 📄 Copying required root files...

if exist "content.js" (
    echo   📄 Copying content.js...
    copy "content.js" "%BUILD_DIR%\"
) else (
    echo   ⚠️  Warning: content.js not found!
)

if exist "manifest.json" (
    echo   📄 Copying manifest.json...
    copy "manifest.json" "%BUILD_DIR%\"
) else (
    echo   ⚠️  Warning: manifest.json not found!
)

if exist "popup.css" (
    echo   📄 Copying popup.css...
    copy "popup.css" "%BUILD_DIR%\"
) else (
    echo   ⚠️  Warning: popup.css not found!
)

if exist "popup.html" (
    echo   📄 Copying popup.html...
    copy "popup.html" "%BUILD_DIR%\"
) else (
    echo   ⚠️  Warning: popup.html not found!
)

if exist "popup.js" (
    echo   📄 Copying popup.js...
    copy "popup.js" "%BUILD_DIR%\"
) else (
    echo   ⚠️  Warning: popup.js not found!
)

if exist "popupView.js" (
    echo   📄 Copying popupView.js...
    copy "popupView.js" "%BUILD_DIR%\"
) else (
    echo   ⚠️  Warning: popupView.js not found!
)

echo.
echo 🎉 Build completed successfully!
echo.
echo 📁 Build directory: %BUILD_DIR%\
echo.
echo 📋 Contents of build directory:
dir "%BUILD_DIR%"
echo.
echo 🚀 Ready for Chrome Web Store upload!
echo    You can upload the folder contents from: %BUILD_DIR%\
echo.
echo 📝 Production build completed with:
echo    ✅ ENV=production in textClassifierServer.js
echo    ✅ MOCK_CLASSIFICATION_API_CALL=false
echo    ✅ Logging level set to 'error'
echo    ✅ All debug information removed
echo.
echo 💡 Note: For Windows, you may need to manually create a zip file
echo    of the %BUILD_DIR% folder for Chrome Web Store upload.
echo.
pause
