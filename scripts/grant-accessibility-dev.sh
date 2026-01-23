#!/bin/bash
# scripts/grant-accessibility-dev.sh
#
# Helper script to grant accessibility permission in development
# 
# macOS revokes accessibility permission every time an unsigned app is rebuilt
# because the code signature changes. This script automates re-granting permission.
#
# Usage: ./scripts/grant-accessibility-dev.sh

set -e

BUNDLE_ID="foo.otteryak.kube-ingress-launcher"

echo "Granting accessibility permission for development..."
echo "Bundle ID: $BUNDLE_ID"
echo ""
echo "This requires sudo access to modify the TCC database."
echo ""

# Reset and grant accessibility permission
sudo sqlite3 /Library/Application\ Support/com.apple.TCC/TCC.db \
  "INSERT or REPLACE INTO access VALUES('kTCCServiceAccessibility','$BUNDLE_ID',0,2,4,1,NULL,NULL,0,'UNUSED',NULL,0,1687786159);"

echo "✅ Accessibility permission granted!"
echo ""
echo "Note: This permission will be revoked again when you rebuild the app."
echo "This is expected behavior for unsigned development builds."
echo ""
echo "To avoid this in production:"
echo "  1. Sign the app with an Apple Developer certificate"
echo "  2. Set signingIdentity in tauri.conf.json"
echo ""
