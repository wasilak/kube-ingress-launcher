#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Function to print colored output
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if version argument is provided
NEW_VERSION=$1

if [ -z "$NEW_VERSION" ]; then
    log_error "Version number required"
    echo ""
    echo "Usage: $0 <version>"
    echo ""
    echo "Examples:"
    echo "  $0 0.1.1    # Patch release (bug fixes)"
    echo "  $0 0.2.0    # Minor release (new features)"
    echo "  $0 1.0.0    # Major release (breaking changes)"
    echo ""
    exit 1
fi

# Validate version format (semantic versioning)
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    log_error "Invalid version format: $NEW_VERSION"
    echo "Version must follow semantic versioning: MAJOR.MINOR.PATCH (e.g., 0.2.0)"
    exit 1
fi

# Get current version from Cargo.toml
CURRENT_VERSION=$(grep '^version = ' "$PROJECT_ROOT/src-tauri/Cargo.toml" | head -1 | sed 's/version = "\(.*\)"/\1/')

log_info "Current version: $CURRENT_VERSION"
log_info "New version: $NEW_VERSION"
echo ""

# Check if working directory is clean
if ! git diff-index --quiet HEAD --; then
    log_warning "Working directory has uncommitted changes"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Aborted"
        exit 1
    fi
fi

# Check if we're on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    log_warning "Not on main branch (current: $CURRENT_BRANCH)"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Aborted"
        exit 1
    fi
fi

# Check if tag already exists
if git rev-parse "v$NEW_VERSION" >/dev/null 2>&1; then
    log_error "Tag v$NEW_VERSION already exists"
    exit 1
fi

log_info "Updating version in Cargo.toml..."
sed -i '' "s/^version = \".*\"/version = \"$NEW_VERSION\"/" "$PROJECT_ROOT/src-tauri/Cargo.toml"
log_success "Updated Cargo.toml"

log_info "Updating version in tauri.conf.json..."
sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" "$PROJECT_ROOT/src-tauri/tauri.conf.json"
log_success "Updated tauri.conf.json"

log_info "Rebuilding to update Cargo.lock..."
cargo build --manifest-path "$PROJECT_ROOT/src-tauri/Cargo.toml" --quiet
log_success "Cargo.lock updated"

log_info "Committing version bump..."
git add "$PROJECT_ROOT/src-tauri/Cargo.toml" "$PROJECT_ROOT/src-tauri/tauri.conf.json" "$PROJECT_ROOT/src-tauri/Cargo.lock"
git commit -m "chore: bump version to $NEW_VERSION"
log_success "Changes committed"

log_info "Creating git tag v$NEW_VERSION..."
git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"
log_success "Tag v$NEW_VERSION created"

echo ""
log_success "Version bumped from $CURRENT_VERSION to $NEW_VERSION"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git show HEAD"
echo "  2. Push to remote: git push origin main"
echo "  3. Push the tag: git push origin v$NEW_VERSION"
echo ""
echo "GitHub Actions will automatically:"
echo "  - Build DMG files for both architectures"
echo "  - Create a GitHub release"
echo "  - Upload DMG files and checksums"
echo ""
