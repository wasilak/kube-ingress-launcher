#!/bin/bash
# scripts/dev-sign.sh
#
# Ad-hoc sign the development build to maintain consistent signature
# This prevents macOS from revoking accessibility permission on each rebuild
#
# Usage: 
#   npm run tauri dev
#   ./scripts/dev-sign.sh
#
# Or for release builds:
#   npm run tauri build
#   ./scripts/dev-sign.sh release

set -e

BUILD_TYPE="${1:-debug}"

if [ "$BUILD_TYPE" = "release" ]; then
    APP_PATH="src-tauri/target/release/bundle/macos/Kube Ingress Launcher.app"
else
    APP_PATH="src-tauri/target/debug/bundle/macos/Kube Ingress Launcher.app"
fi

if [ ! -d "$APP_PATH" ]; then
    echo "❌ App bundle not found at: $APP_PATH"
    echo ""
    echo "Please build the app first:"
    echo "  npm run tauri dev    (for debug build)"
    echo "  npm run tauri build  (for release build)"
    exit 1
fi

echo "🔐 Ad-hoc signing app bundle..."
echo "Path: $APP_PATH"
echo ""

# Ad-hoc sign with - identity
# --deep signs all nested code
# --force replaces existing signature
codesign -s - -f --deep "$APP_PATH"

echo "✅ App signed successfully!"
echo ""
echo "The app now has a consistent signature that will persist across rebuilds."
echo "You only need to grant accessibility permission once."
echo ""
echo "Note: You'll need to run this script after each rebuild."
echo "Consider adding it to your development workflow."
