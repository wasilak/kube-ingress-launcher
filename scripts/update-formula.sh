#!/bin/bash
# scripts/update-formula.sh
# 
# Updates the Homebrew Cask formula with new version and checksums
# 
# Usage: ./scripts/update-formula.sh
# 
# Prerequisites:
# - Git configured with SSH access to the tap repository
# - New release must be published on GitHub with DMG files and checksums

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
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TAP_REPO="git@github.com:wasilak/homebrew-kube-ingress-launcher.git"
TAP_DIR="$PROJECT_ROOT/homebrew-kube-ingress-launcher"
CASK_FILE="Casks/kube-ingress-launcher.rb"
GITHUB_REPO="wasilak/kube-ingress-desktop"

log_info "Starting Homebrew Cask formula update process"

# Get version from Cargo.toml
log_step "Extracting version from Cargo.toml..."
VERSION=$("$SCRIPT_DIR/get-version.sh")

if [ -z "$VERSION" ]; then
    log_error "Failed to extract version from Cargo.toml"
    exit 1
fi

log_info "Version: $VERSION"

# Download checksums from GitHub release
log_step "Downloading checksums from GitHub release v$VERSION..."

INTEL_CHECKSUM_URL="https://github.com/$GITHUB_REPO/releases/download/v${VERSION}/checksums-x86_64-apple-darwin.txt"
ARM_CHECKSUM_URL="https://github.com/$GITHUB_REPO/releases/download/v${VERSION}/checksums-aarch64-apple-darwin.txt"

# Download Intel checksums
if ! curl -sLf "$INTEL_CHECKSUM_URL" -o checksums-intel.txt; then
    log_error "Failed to download Intel checksums from: $INTEL_CHECKSUM_URL"
    log_error "Make sure the release v$VERSION exists and includes checksum files"
    exit 1
fi

# Download ARM checksums
if ! curl -sLf "$ARM_CHECKSUM_URL" -o checksums-arm.txt; then
    log_error "Failed to download ARM checksums from: $ARM_CHECKSUM_URL"
    rm -f checksums-intel.txt
    exit 1
fi

log_info "Checksums downloaded successfully"

# Extract checksums
log_step "Extracting SHA256 checksums..."
INTEL_SHA=$(grep "kube-ingress-launcher" checksums-intel.txt | cut -d' ' -f1)
ARM_SHA=$(grep "kube-ingress-launcher" checksums-arm.txt | cut -d' ' -f1)

if [ -z "$INTEL_SHA" ] || [ -z "$ARM_SHA" ]; then
    log_error "Failed to extract checksums from downloaded files"
    rm -f checksums-intel.txt checksums-arm.txt
    exit 1
fi

log_info "Intel (x86_64) SHA256: $INTEL_SHA"
log_info "ARM (aarch64) SHA256: $ARM_SHA"

# Clone or update tap repository
if [ -d "$TAP_DIR" ]; then
    log_step "Updating existing tap repository..."
    cd "$TAP_DIR"
    git fetch origin
    git reset --hard origin/main
else
    log_step "Cloning tap repository..."
    git clone "$TAP_REPO" "$TAP_DIR"
    cd "$TAP_DIR"
fi

log_info "Tap repository ready"

# Verify Cask file exists
if [ ! -f "$CASK_FILE" ]; then
    log_error "Cask file not found: $CASK_FILE"
    cd "$PROJECT_ROOT"
    rm -f checksums-intel.txt checksums-arm.txt
    exit 1
fi

# Update the Cask formula
log_step "Updating Cask formula..."

# Backup original file
cp "$CASK_FILE" "${CASK_FILE}.backup"

# Update version
sed -i.tmp "s/version \"[^\"]*\"/version \"$VERSION\"/" "$CASK_FILE"

# Update ARM SHA256
sed -i.tmp "s/sha256 arm:   \"[^\"]*\"/sha256 arm:   \"$ARM_SHA\"/" "$CASK_FILE"

# Update Intel SHA256
sed -i.tmp "s/intel: \"[^\"]*\"/intel: \"$INTEL_SHA\"/" "$CASK_FILE"

# Remove temporary files
rm -f "${CASK_FILE}.tmp"

# Verify changes were made
if ! grep -q "version \"$VERSION\"" "$CASK_FILE"; then
    log_error "Failed to update version in Cask formula"
    mv "${CASK_FILE}.backup" "$CASK_FILE"
    cd "$PROJECT_ROOT"
    rm -f checksums-intel.txt checksums-arm.txt
    exit 1
fi

log_info "Cask formula updated successfully"

# Show diff
log_step "Changes made to Cask formula:"
git diff "$CASK_FILE" || true

# Commit and push
log_step "Committing changes..."
git add "$CASK_FILE"

if git diff --staged --quiet; then
    log_warning "No changes to commit (formula may already be up to date)"
    rm -f "${CASK_FILE}.backup"
    cd "$PROJECT_ROOT"
    rm -f checksums-intel.txt checksums-arm.txt
    exit 0
fi

git commit -m "Update kube-ingress-launcher to $VERSION

- Version: $VERSION
- Intel SHA256: $INTEL_SHA
- ARM SHA256: $ARM_SHA

Automated update from release workflow."

log_step "Pushing changes to GitHub..."
git push origin main

log_info "Formula updated and pushed successfully!"

# Cleanup
rm -f "${CASK_FILE}.backup"
cd "$PROJECT_ROOT"
rm -f checksums-intel.txt checksums-arm.txt

log_info "Update complete!"
log_info ""
log_info "Users can now install the new version with:"
log_info "  brew upgrade --cask kube-ingress-launcher"
log_info ""
log_info "Or for new installations:"
log_info "  brew tap wasilak/kube-ingress-launcher"
log_info "  brew install --cask kube-ingress-launcher"
