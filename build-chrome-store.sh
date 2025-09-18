#!/bin/bash

# Build script for Chrome Web Store upload
# This script builds the extension and creates a folder ready for Chrome Web Store upload

set -e  # Exit on any error

echo "🚀 Starting Chrome Web Store build process..."

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
