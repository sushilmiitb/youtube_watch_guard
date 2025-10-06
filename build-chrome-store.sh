#!/bin/bash

# Build script for Chrome Web Store upload
# This script builds the extension and creates a folder ready for Chrome Web Store upload

set -e  # Exit on any error

echo "🚀 Starting Chrome Web Store build process..."

# Check if we're in production environment
echo "🔍 Checking environment configuration..."

# Check ENV in classificationConfig.js
if ! grep -q "export const ENV = 'production';" src/classificationConfig.js; then
    echo "❌ Error: ENV is not set to 'production' in src/classificationConfig.js"
    echo "   Current setting in classificationConfig.js:"
    grep "export const ENV" src/classificationConfig.js || echo "   No ENV found in classificationConfig.js"
    echo "   Please set ENV = 'production' in src/classificationConfig.js for production builds"
    exit 1
fi

# Check MOCK_CLASSIFICATION_API_CALL in classificationConfig.js
if ! grep -q "export const MOCK_CLASSIFICATION_API_CALL = false;" src/classificationConfig.js; then
    echo "❌ Error: MOCK_CLASSIFICATION_API_CALL is not set to 'false' in src/classificationConfig.js"
    echo "   Current setting in classificationConfig.js:"
    grep "export const MOCK_CLASSIFICATION_API_CALL" src/classificationConfig.js || echo "   No MOCK_CLASSIFICATION_API_CALL found in classificationConfig.js"
    echo "   Please set MOCK_CLASSIFICATION_API_CALL = false in src/classificationConfig.js for production builds"
    exit 1
fi

# Check logging level in logger.js
echo "🔍 Checking logging configuration..."
if ! grep -q "let currentLevel = 'error';" src/logger.js; then
    echo "❌ Error: Logging level is not set to 'error' in src/logger.js"
    echo "   Current setting in logger.js:"
    grep "let currentLevel =" src/logger.js || echo "   No currentLevel found in logger.js"
    echo "   Please set currentLevel = 'error' in src/logger.js for production builds"
    exit 1
fi

echo "✅ Environment and logging checks passed!"
echo ""

# Define build directory name
BUILD_DIR="chrome-store-build"
EXTENSION_NAME="youtube-watch-guard"

# Clean up any existing build directory
if [ -d "$BUILD_DIR" ]; then
    echo "🧹 Cleaning up existing build directory..."
    rm -rf "$BUILD_DIR"
fi

# Create build directory
echo "📁 Creating build directory..."
mkdir -p "$BUILD_DIR"

# Run build commands
echo "🔨 Running build commands..."

echo "  📦 Building CSS..."
npm run build:css

echo "  📦 Building content script..."
npm run build:content

echo "✅ Build commands completed successfully!"

# Copy required folders
echo "📋 Copying required folders..."

echo "  📁 Copying dist folder..."
cp -r dist "$BUILD_DIR/"

echo "  📁 Copying images folder..."
cp -r images "$BUILD_DIR/"

echo "  📁 Copying src folder..."
cp -r src "$BUILD_DIR/"

# Copy required root files
echo "📄 Copying required root files..."

REQUIRED_FILES=(
    "content.js"
    "manifest.json"
    "popup.css"
    "popup.html"
    "popup.js"
    "popupView.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  📄 Copying $file..."
        cp "$file" "$BUILD_DIR/"
    else
        echo "  ⚠️  Warning: $file not found!"
    fi
done

# Create a zip file for easy upload
echo "🗜️  Creating zip file..."
cd "$BUILD_DIR"
zip -r "../${EXTENSION_NAME}-chrome-store.zip" . -x "*.DS_Store" "*.git*"
cd ..

echo ""
echo "🎉 Build completed successfully!"
echo ""
echo "📁 Build directory: $BUILD_DIR/"
echo "📦 Zip file: ${EXTENSION_NAME}-chrome-store.zip"
echo ""
echo "📋 Contents of build directory:"
ls -la "$BUILD_DIR/"
echo ""
echo "🚀 Ready for Chrome Web Store upload!"
echo "   You can either:"
echo "   1. Upload the zip file: ${EXTENSION_NAME}-chrome-store.zip"
echo "   2. Or upload the folder contents from: $BUILD_DIR/"
echo ""
echo "📝 Production build completed with:"
echo "   ✅ ENV=production in classificationConfig.js"
echo "   ✅ MOCK_CLASSIFICATION_API_CALL=false"
echo "   ✅ Logging level set to 'error'"
echo "   ✅ All debug information removed"
