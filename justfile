# justfile - Task automation for kube-ingress-desktop
# Install just: brew install just
# Usage: just <recipe>
# List all recipes: just --list

# Default recipe - show available commands
default:
    @just --list

# Development workflow - build, sign, then you can run manually
dev:
    @echo "🚀 Building for development..."
    npm run tauri build -- --debug
    @echo "🔐 Signing app bundle..."
    ./scripts/dev-sign.sh
    @echo "✅ Ready! Run the app with 'just open' or from Applications"
    @echo ""
    @echo "To run: just open"

# Build, sign, and open the app
dev-run: dev open

# Run the dev server with hot reload (no signing, permission resets)
dev-server:
    @echo "🚀 Starting dev server with hot reload..."
    @echo "⚠️  Note: Accessibility permission will reset on rebuild"
    npm run tauri dev

# Build universal binary for production
build:
    @echo "🏗️  Building universal binary..."
    npm run tauri build -- --target universal-apple-darwin
    @echo "✅ Build complete!"

# Build and sign for local testing (mimics production)
build-signed: build
    @echo "🔐 Signing release build..."
    ./scripts/dev-sign.sh release
    @echo "✅ Signed build ready for testing!"

# Create DMG from built app
dmg:
    @echo "📦 Creating DMG..."
    ./scripts/create-dmg.sh "src-tauri/target/universal-apple-darwin/release/bundle/macos/Kube Ingress Launcher.app" "$(just version)" "universal-apple-darwin"
    @echo "✅ DMG created!"

# Run all tests (frontend + backend)
test:
    @echo "🧪 Running frontend tests..."
    npm test
    @echo "🧪 Running backend tests..."
    cargo test --manifest-path src-tauri/Cargo.toml
    @echo "✅ All tests passed!"

# Run frontend tests only
test-frontend:
    @echo "🧪 Running frontend tests..."
    npm test

# Run backend tests only
test-backend:
    @echo "🧪 Running Rust tests..."
    cargo test --manifest-path src-tauri/Cargo.toml

# Lint all code (frontend + backend)
lint:
    @echo "🔍 Linting frontend..."
    -npm run lint
    @echo "🔍 Linting backend..."
    cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
    @echo "✅ Linting complete!"

# Format all code
fmt:
    @echo "✨ Formatting frontend..."
    npm run format || true
    @echo "✨ Formatting backend..."
    cargo fmt --manifest-path src-tauri/Cargo.toml
    @echo "✅ Formatting complete!"

# Run all checks (lint + test + build)
check: lint test
    @echo "🔍 Checking frontend build..."
    npm run build
    @echo "🔍 Checking backend build..."
    cargo build --manifest-path src-tauri/Cargo.toml
    @echo "✅ All checks passed!"

# Clean all build artifacts
clean:
    @echo "🧹 Cleaning build artifacts..."
    rm -rf dist
    rm -rf src-tauri/target
    rm -rf node_modules/.vite
    @echo "✅ Clean complete!"

# Deep clean (including node_modules)
clean-all: clean
    @echo "🧹 Removing node_modules..."
    rm -rf node_modules
    @echo "✅ Deep clean complete!"

# Install all dependencies
deps:
    @echo "📦 Installing dependencies..."
    npm ci
    @echo "✅ Dependencies installed!"

# Show current version
version:
    @./scripts/get-version.sh

# Bump version (usage: just bump 0.1.2)
bump VERSION:
    @echo "📝 Bumping version to {{VERSION}}..."
    ./scripts/bump-version.sh {{VERSION}}
    @echo "✅ Version bumped! Don't forget to push: git ptf"

# Quick patch release (bump patch, build, tag, push)
release-patch:
    #!/usr/bin/env bash
    set -euo pipefail
    CURRENT=$(./scripts/get-version.sh)
    IFS='.' read -r major minor patch <<< "$CURRENT"
    NEW_PATCH=$((patch + 1))
    NEW_VERSION="$major.$minor.$NEW_PATCH"
    echo "🚀 Creating patch release: $CURRENT → $NEW_VERSION"
    ./scripts/bump-version.sh "$NEW_VERSION"
    echo "✅ Version bumped! Push with: git ptf"

# Quick minor release (bump minor, build, tag, push)
release-minor:
    #!/usr/bin/env bash
    set -euo pipefail
    CURRENT=$(./scripts/get-version.sh)
    IFS='.' read -r major minor patch <<< "$CURRENT"
    NEW_MINOR=$((minor + 1))
    NEW_VERSION="$major.$NEW_MINOR.0"
    echo "🚀 Creating minor release: $CURRENT → $NEW_VERSION"
    ./scripts/bump-version.sh "$NEW_VERSION"
    echo "✅ Version bumped! Push with: git ptf"

# Grant accessibility permission (development helper)
grant-permission:
    @echo "🔓 Granting accessibility permission..."
    ./scripts/grant-accessibility-dev.sh

# Open app in Finder
open:
    @open "src-tauri/target/debug/bundle/macos/Kube Ingress Launcher.app"

# Open release app in Finder
open-release:
    @open "src-tauri/target/universal-apple-darwin/release/bundle/macos/Kube Ingress Launcher.app"

# Show app info (bundle ID, version, etc)
info:
    @echo "📋 App Information:"
    @echo "  Name: Kube Ingress Launcher"
    @echo "  Bundle ID: foo.otteryak.kube-ingress-launcher"
    @echo "  Version: $(just version)"
    @echo "  Build: $(git rev-parse --short HEAD)"
    @echo "  Branch: $(git branch --show-current)"

# Watch and rebuild on file changes (requires cargo-watch)
watch:
    @echo "👀 Watching for changes..."
    cargo watch -x "build --manifest-path src-tauri/Cargo.toml"
