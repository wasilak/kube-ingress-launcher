#!/bin/bash
# scripts/create-dmg.sh
# 
# Creates a DMG file from a macOS .app bundle for distribution via Homebrew Cask
# 
# Usage: ./scripts/create-dmg.sh <app_bundle_path> <version> <architecture>
# Example: ./scripts/create-dmg.sh "target/release/bundle/macos/Kube Ingress Launcher.app" "0.1.0" "x86_64"

set -e  # Exit on error
set -u  # Exit on undefined variable

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Validate arguments
if [ $# -ne 3 ]; then
    log_error "Usage: $0 <app_bundle_path> <version> <architecture>"
    log_error "Example: $0 \"target/release/bundle/macos/Kube Ingress Launcher.app\" \"0.1.0\" \"x86_64\""
    exit 1
fi

APP_BUNDLE="$1"
VERSION="$2"
ARCH="$3"

# Validate app bundle exists
if [ ! -d "$APP_BUNDLE" ]; then
    log_error "App bundle not found: $APP_BUNDLE"
    exit 1
fi

# Validate app bundle is actually a .app
if [[ ! "$APP_BUNDLE" =~ \.app$ ]]; then
    log_error "Path does not appear to be a .app bundle: $APP_BUNDLE"
    exit 1
fi

# Validate version format (basic semantic versioning check)
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    log_warning "Version does not follow semantic versioning format (MAJOR.MINOR.PATCH): $VERSION"
fi

# Validate architecture
if [[ ! "$ARCH" =~ ^(x86_64|aarch64)$ ]]; then
    log_error "Architecture must be either 'x86_64' or 'aarch64', got: $ARCH"
    exit 1
fi

# Configuration
APP_NAME="Kube Ingress Launcher"
DMG_NAME="kube-ingress-launcher-${VERSION}-${ARCH}.dmg"
TEMP_DIR=$(mktemp -d)

log_info "Starting DMG creation process"
log_info "App Bundle: $APP_BUNDLE"
log_info "Version: $VERSION"
log_info "Architecture: $ARCH"
log_info "Output DMG: $DMG_NAME"
log_info "Temporary directory: $TEMP_DIR"

# Cleanup function to remove temp directory on exit
cleanup() {
    if [ -d "$TEMP_DIR" ]; then
        log_info "Cleaning up temporary directory: $TEMP_DIR"
        rm -rf "$TEMP_DIR"
    fi
}
trap cleanup EXIT

# Copy app bundle to temp directory
log_info "Copying app bundle to temporary directory..."
cp -R "$APP_BUNDLE" "$TEMP_DIR/" || {
    log_error "Failed to copy app bundle to temporary directory"
    exit 1
}

# Verify the copy was successful
COPIED_APP="$TEMP_DIR/$(basename "$APP_BUNDLE")"
if [ ! -d "$COPIED_APP" ]; then
    log_error "App bundle not found in temporary directory after copy"
    exit 1
fi

log_info "App bundle copied successfully"

# Remove any existing DMG with the same name
if [ -f "$DMG_NAME" ]; then
    log_warning "Removing existing DMG: $DMG_NAME"
    rm -f "$DMG_NAME"
fi

# Create DMG using hdiutil
log_info "Creating DMG with maximum compression..."
hdiutil create \
    -volname "$APP_NAME" \
    -srcfolder "$TEMP_DIR" \
    -ov \
    -format UDZO \
    -fs HFS+ \
    "$DMG_NAME" || {
    log_error "Failed to create DMG"
    exit 1
}

# Verify DMG was created
if [ ! -f "$DMG_NAME" ]; then
    log_error "DMG file was not created: $DMG_NAME"
    exit 1
fi

# Get DMG file size
DMG_SIZE=$(du -h "$DMG_NAME" | cut -f1)

log_info "DMG created successfully!"
log_info "File: $DMG_NAME"
log_info "Size: $DMG_SIZE"

# Calculate SHA256 checksum
log_info "Calculating SHA256 checksum..."
CHECKSUM=$(shasum -a 256 "$DMG_NAME" | cut -d' ' -f1)
log_info "SHA256: $CHECKSUM"

# Create checksum file
CHECKSUM_FILE="${DMG_NAME}.sha256"
echo "$CHECKSUM  $DMG_NAME" > "$CHECKSUM_FILE"
log_info "Checksum saved to: $CHECKSUM_FILE"

log_info "DMG creation complete!"
