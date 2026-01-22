#!/bin/bash
# scripts/update-formula.sh
# 
# Updates the Homebrew Cask formula in the separate tap repository
# 
# Usage: ./scripts/update-formula.sh <version> [tap-repo-path]
# Example: ./scripts/update-formula.sh 0.2.0 ../homebrew-kube-ingress-launcher
# 
# Prerequisites:
# - New release must be published on GitHub with DMG files and checksums
# - Tap repository must be cloned locally

set -e  # Exit on error
set -u  # Exit on undefined variable

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_step() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GITHUB_REPO="wasilak/kube-ingress-launcher"

# Check if version argument is provided
if [ $# -lt 1 ]; then
    log_error "Version number required"
    echo ""
    echo "Usage: $0 <version> [tap-repo-path]"
    echo "Example: $0 0.2.0 ../homebrew-kube-ingress-launcher"
    echo ""
    echo "If tap-repo-path is not provided, will look for:"
    echo "  - ../homebrew-kube-ingress-launcher"
    echo "  - ~/git/homebrew-kube-ingress-launcher"
    echo ""
    exit 1
fi

VERSION=$1

# Determine tap repository path
if [ $# -ge 2 ]; then
    TAP_REPO="$2"
else
    # Try common locations
    if [ -d "$PROJECT_ROOT/../homebrew-kube-ingress-launcher" ]; then
        TAP_REPO="$PROJECT_ROOT/../homebrew-kube-ingress-launcher"
    elif [ -d "$HOME/git/homebrew-kube-ingress-launcher" ]; then
        TAP_REPO="$HOME/git/homebrew-kube-ingress-launcher"
    else
        log_error "Tap repository not found"
        echo ""
        echo "Please specify the path to the tap repository:"
        echo "  $0 $VERSION /path/to/homebrew-kube-ingress-launcher"
        echo ""
        exit 1
    fi
fi

# Resolve to absolute path
TAP_REPO="$(cd "$TAP_REPO" && pwd)"
CASK_FILE="$TAP_REPO/Casks/kube-ingress-launcher.rb"

log_info "Updating Homebrew Cask formula for version $VERSION"
log_info "Tap repository: $TAP_REPO"
echo ""

# Check if cask file exists
if [ ! -f "$CASK_FILE" ]; then
    log_error "Cask file not found: $CASK_FILE"
    exit 1
fi

# Download checksums from GitHub release
log_step "Downloading checksums from GitHub release v$VERSION..."

TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

cd "$TEMP_DIR"

if ! curl -sL "https://github.com/$GITHUB_REPO/releases/download/v${VERSION}/checksums-x86_64-apple-darwin.txt" -o checksums-intel.txt; then
    log_error "Failed to download Intel checksums"
    log_warning "Make sure the release v$VERSION exists and includes checksum files"
    exit 1
fi

if ! curl -sL "https://github.com/$GITHUB_REPO/releases/download/v${VERSION}/checksums-aarch64-apple-darwin.txt" -o checksums-arm.txt; then
    log_error "Failed to download ARM checksums"
    exit 1
fi

log_info "Checksums downloaded"

# Extract checksums
log_step "Extracting SHA256 checksums..."

INTEL_SHA=$(grep "kube-ingress-launcher.*x86_64.*\.dmg" checksums-intel.txt | awk '{print $1}')
ARM_SHA=$(grep "kube-ingress-launcher.*aarch64.*\.dmg" checksums-arm.txt | awk '{print $1}')

if [ -z "$INTEL_SHA" ] || [ -z "$ARM_SHA" ]; then
    log_error "Failed to extract checksums from downloaded files"
    exit 1
fi

log_info "Intel SHA256: $INTEL_SHA"
log_info "ARM SHA256: $ARM_SHA"
echo ""

# Update the Cask file
log_step "Updating Cask formula..."

cd "$TAP_REPO"

# Update version
sed -i '' "s/version \".*\"/version \"$VERSION\"/" "$CASK_FILE"

# Update checksums
sed -i '' "s/sha256 arm:   \".*\",/sha256 arm:   \"$ARM_SHA\",/" "$CASK_FILE"
sed -i '' "s/intel: \".*\"/intel: \"$INTEL_SHA\"/" "$CASK_FILE"

log_info "Cask formula updated"
echo ""

# Show the changes
log_step "Changes made to Cask formula:"
echo ""
git diff "$CASK_FILE" || true
echo ""

# Commit the changes
log_step "Committing changes..."

git add "$CASK_FILE"
git commit -m "chore: update Homebrew Cask formula to version $VERSION

- Update version to $VERSION
- Update Intel SHA256: $INTEL_SHA
- Update ARM SHA256: $ARM_SHA"

log_info "Changes committed"
echo ""

log_info "Formula update complete!"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git -C $TAP_REPO show HEAD"
echo "  2. Push to GitHub: git -C $TAP_REPO push origin main"
echo ""
echo "Users can then update with:"
echo "  brew update"
echo "  brew upgrade --cask kube-ingress-launcher"
echo ""
