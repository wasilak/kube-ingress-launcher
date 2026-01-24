#!/bin/bash
# Sign app with self-signed certificate for testing
# This mimics what CI does with the self-signed certificate

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Certificate details
CERT_DIR=".signing-temp"
CERT_FILE="$CERT_DIR/certificate.p12"
CERT_PASSWORD="kube-ingress-signing-2026"
SIGNING_IDENTITY="Kube Ingress Launcher"
KEYCHAIN_NAME="kube-ingress-test.keychain-db"
KEYCHAIN_PATH="$HOME/Library/Keychains/$KEYCHAIN_NAME"

# Determine build type (debug or release)
BUILD_TYPE="${1:-debug}"

if [ "$BUILD_TYPE" = "release" ]; then
    APP_BUNDLE="src-tauri/target/universal-apple-darwin/release/bundle/macos/Kube Ingress Launcher.app"
else
    APP_BUNDLE="src-tauri/target/debug/bundle/macos/Kube Ingress Launcher.app"
fi

echo -e "${BLUE}🔐 Signing with self-signed certificate${NC}"
echo ""

# Check if certificate exists
if [ ! -f "$CERT_FILE" ]; then
    echo -e "${RED}❌ Certificate not found: $CERT_FILE${NC}"
    echo -e "${YELLOW}Run this first to generate certificate:${NC}"
    echo -e "  just generate-cert"
    exit 1
fi

# Check if app bundle exists
if [ ! -d "$APP_BUNDLE" ]; then
    echo -e "${RED}❌ App bundle not found: $APP_BUNDLE${NC}"
    echo -e "${YELLOW}Build the app first:${NC}"
    if [ "$BUILD_TYPE" = "release" ]; then
        echo -e "  just build"
    else
        echo -e "  npm run tauri build -- --debug"
    fi
    exit 1
fi

echo -e "${BLUE}📦 App bundle: $APP_BUNDLE${NC}"
echo ""

# Create temporary keychain
echo -e "${BLUE}🔑 Creating temporary keychain...${NC}"
KEYCHAIN_PASSWORD=$(openssl rand -base64 32)

# Delete existing keychain if it exists
if [ -f "$KEYCHAIN_PATH" ]; then
    security delete-keychain "$KEYCHAIN_PATH" 2>/dev/null || true
fi

security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
security set-keychain-settings -lut 21600 "$KEYCHAIN_PATH"
security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"

echo -e "${GREEN}✅ Keychain created${NC}"
echo ""

# Import certificate
echo -e "${BLUE}📥 Importing certificate...${NC}"
security import "$CERT_FILE" -k "$KEYCHAIN_PATH" -P "$CERT_PASSWORD" -T /usr/bin/codesign
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"

# Add to search list
security list-keychain -d user -s "$KEYCHAIN_PATH" $(security list-keychains -d user | sed 's/"//g')

echo -e "${GREEN}✅ Certificate imported${NC}"
echo ""

# Verify certificate is available
echo -e "${BLUE}🔍 Available signing identities:${NC}"
security find-identity -v -p codesigning "$KEYCHAIN_PATH"
echo ""

# Sign the app
echo -e "${BLUE}✍️  Signing app bundle...${NC}"
codesign -s "$SIGNING_IDENTITY" -f --deep --timestamp --options runtime "$APP_BUNDLE" 2>&1 || {
    echo -e "${RED}❌ Signing failed${NC}"
    security delete-keychain "$KEYCHAIN_PATH" 2>/dev/null || true
    exit 1
}

echo -e "${GREEN}✅ App signed successfully${NC}"
echo ""

# Verify signature
echo -e "${BLUE}🔍 Verifying signature...${NC}"
codesign -dv --verbose=4 "$APP_BUNDLE" 2>&1 | grep -E "(Authority|Identifier|Signed Time)" || true
echo ""

# Cleanup keychain
echo -e "${BLUE}🧹 Cleaning up temporary keychain...${NC}"
security delete-keychain "$KEYCHAIN_PATH" 2>/dev/null || true
echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

echo -e "${GREEN}✅ Done! App is signed with self-signed certificate${NC}"
echo -e "${BLUE}Authority: $SIGNING_IDENTITY${NC}"
echo ""
echo -e "${YELLOW}To run the app:${NC}"
if [ "$BUILD_TYPE" = "release" ]; then
    echo -e "  just open-release"
else
    echo -e "  just open"
fi
