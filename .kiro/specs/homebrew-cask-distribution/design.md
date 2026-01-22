# Design Document

## Overview

This document outlines the technical design for distributing the Kube Ingress Launcher desktop application via Homebrew Cask. The solution provides an automated pipeline that builds unsigned macOS application bundles, packages them as DMG files, creates GitHub releases, and maintains a Homebrew Cask formula for easy installation.

## Architecture

### High-Level Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Git Tag Push  │───▶│   CI/CD Build   │───▶│ GitHub Release  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Build DMG      │    │  Update Tap     │
                       │  (x86_64 +      │    │  Formula        │
                       │   aarch64)      │    │                 │
                       └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Upload Assets   │    │ User Install    │
                       │ + Checksums     │    │ via Homebrew    │
                       └─────────────────┘    └─────────────────┘
```

### Components

1. **Build System**: GitHub Actions workflow for automated builds
2. **Application Bundle**: Tauri-generated .app bundle
3. **DMG Creator**: Tool to package .app into distributable DMG
4. **Release Manager**: GitHub API integration for release creation
5. **Tap Repository**: Separate repository containing Homebrew Cask formula
6. **Formula Updater**: Automated tool to update Cask formula with new releases

## Technical Implementation

### 1. Tauri Configuration

#### Bundle Configuration (tauri.conf.json)

```json
{
  "bundle": {
    "identifier": "foo.otteryak.kube-ingress-desktop",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "resources": [],
    "copyright": "",
    "category": "DeveloperTool",
    "shortDescription": "Kubernetes Ingress Launcher",
    "longDescription": "A desktop launcher for quickly searching and opening Kubernetes ingress resources",
    "macOS": {
      "frameworks": [],
      "minimumSystemVersion": "10.13",
      "exceptionDomain": "",
      "signingIdentity": null,
      "providerShortName": null,
      "entitlements": null
    }
  }
}
```

#### Key Configuration Points

- **Bundle Identifier**: `com.piotrek.kube-ingress-desktop`
- **Minimum macOS Version**: 10.13 (High Sierra)
- **Signing Identity**: `null` (unsigned distribution)
- **Category**: DeveloperTool (appropriate for Kubernetes tooling)

### 2. GitHub Actions Workflow

#### Workflow File: `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-release:
    runs-on: macos-latest
    
    strategy:
      matrix:
        target: [x86_64-apple-darwin, aarch64-apple-darwin]
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Tauri app
        run: |
          npm run tauri build -- --target ${{ matrix.target }}
      
      - name: Create DMG
        run: |
          # DMG creation logic here
      
      - name: Calculate checksums
        run: |
          shasum -a 256 *.dmg > checksums.txt
      
      - name: Upload to release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            *.dmg
            checksums.txt
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  
  update-tap:
    needs: build-and-release
    runs-on: ubuntu-latest
    steps:
      - name: Update Homebrew Tap
        # Tap update logic here
```

#### Workflow Features

- **Multi-architecture builds**: Supports both Intel (x86_64) and Apple Silicon (aarch64)
- **Automated DMG creation**: Packages .app bundle into distributable DMG
- **Checksum generation**: Creates SHA256 checksums for verification
- **Release creation**: Automatically creates GitHub release with artifacts
- **Tap updates**: Updates Homebrew Cask formula with new version

### 3. DMG Creation

#### DMG Build Script

```bash
#!/bin/bash
# scripts/create-dmg.sh

set -e

APP_NAME="Kube Ingress Launcher"
APP_BUNDLE="$1"  # Path to .app bundle
VERSION="$2"     # Version string
ARCH="$3"        # Architecture (x86_64 or aarch64)

DMG_NAME="${APP_NAME// /-}-${VERSION}-${ARCH}.dmg"
TEMP_DIR=$(mktemp -d)

# Copy app bundle to temp directory
cp -R "$APP_BUNDLE" "$TEMP_DIR/"

# Create DMG
hdiutil create -volname "$APP_NAME" \
               -srcfolder "$TEMP_DIR" \
               -ov \
               -format UDZO \
               -compression 9 \
               "$DMG_NAME"

# Cleanup
rm -rf "$TEMP_DIR"

echo "Created: $DMG_NAME"
```

#### DMG Specifications

- **Format**: UDZO (compressed)
- **Compression**: Level 9 (maximum)
- **Contents**: Single .app bundle
- **Naming**: `kube-ingress-launcher-{version}-{arch}.dmg`

### 4. Homebrew Cask Formula

#### Formula Structure

```ruby
cask "kube-ingress-launcher" do
  version "1.0.0"
  
  arch arm: "aarch64", intel: "x86_64"
  
  url "https://github.com/wasilak/kube-ingress-desktop/releases/download/v#{version}/kube-ingress-launcher-#{version}-#{arch}-apple-darwin.dmg"
  sha256 arm:   "sha256_for_arm64_dmg",
         intel: "sha256_for_x86_64_dmg"
  
  name "Kube Ingress Launcher"
  desc "Desktop launcher for quickly searching and opening Kubernetes ingress resources"
  homepage "https://github.com/wasilak/kube-ingress-desktop"
  
  app "Kube Ingress Launcher.app"
  
  zap trash: [
    "~/Library/Application Support/foo.otteryak.kube-ingress-desktop",
    "~/Library/Preferences/foo.otteryak.kube-ingress-desktop.plist",
    "~/Library/Saved Application State/foo.otteryak.kube-ingress-desktop.savedState",
  ]
end
```

#### Formula Features

- **Multi-architecture support**: Automatically selects correct DMG based on system architecture
- **Version management**: Uses semantic versioning
- **Proper cleanup**: Includes `zap` stanza for complete uninstallation
- **Metadata**: Includes name, description, and homepage

### 5. Tap Repository Structure

#### Repository: `homebrew-kube-ingress-launcher`

```
homebrew-kube-ingress-launcher/
├── Casks/
│   └── kube-ingress-launcher.rb
├── README.md
└── .github/
    └── workflows/
        └── update-formula.yml
```

#### Tap Features

- **Standard structure**: Follows Homebrew conventions
- **Automated updates**: GitHub Actions workflow for formula updates
- **Documentation**: Clear installation and usage instructions

### 6. Formula Update Automation

#### Update Workflow

```yaml
name: Update Formula

on:
  repository_dispatch:
    types: [new-release]

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout tap
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.TAP_UPDATE_TOKEN }}
      
      - name: Update formula
        run: |
          # Download new release info
          # Update version and checksums
          # Commit and push changes
```

## Security Considerations

### Unsigned Distribution

Since the application will be distributed unsigned (no Apple Developer certificate):

1. **Gatekeeper Bypass**: Users must manually bypass macOS Gatekeeper
2. **User Education**: Clear documentation on security implications
3. **Verification**: Provide SHA256 checksums for integrity verification
4. **Trust Model**: Users must trust the source repository

### Security Best Practices

1. **Minimal Permissions**: App requests only necessary system permissions
2. **Secure Defaults**: Conservative security settings in Tauri configuration
3. **Dependency Management**: Regular updates of Rust and npm dependencies
4. **Code Review**: All changes reviewed before release

## Version Management

### Versioning Strategy

- **Source of Truth**: `Cargo.toml` version field
- **Format**: Semantic versioning (MAJOR.MINOR.PATCH)
- **Git Tags**: Format `v{version}` (e.g., `v1.0.0`)
- **Consistency**: Same version across all artifacts

### Version Extraction

```bash
# Extract version from Cargo.toml
VERSION=$(grep '^version = ' src-tauri/Cargo.toml | sed 's/version = "\(.*\)"/\1/')
```

## Error Handling

### Build Failures

1. **Rust Compilation Errors**: Clear error messages with suggested fixes
2. **Node.js Build Errors**: Dependency and build tool validation
3. **DMG Creation Errors**: Disk space and permission checks
4. **Upload Failures**: Retry logic with exponential backoff

### Runtime Errors

1. **Installation Issues**: Comprehensive troubleshooting guide
2. **Gatekeeper Blocks**: Step-by-step bypass instructions
3. **Permission Errors**: Clear explanation of required permissions

## Testing Strategy

### Automated Testing

1. **Build Verification**: Ensure builds complete successfully
2. **DMG Validation**: Verify DMG structure and contents
3. **Formula Syntax**: Validate Homebrew Cask formula syntax
4. **Installation Testing**: Automated installation on clean macOS systems

### Manual Testing

1. **End-to-End Installation**: Complete user workflow testing
2. **Multi-Architecture**: Testing on both Intel and Apple Silicon Macs
3. **Gatekeeper Bypass**: Verify bypass procedures work correctly
4. **Uninstallation**: Ensure complete removal of application files

## Deployment Pipeline

### Release Process

1. **Version Bump**: Update version in `Cargo.toml`
2. **Tag Creation**: Create and push version tag
3. **Automated Build**: GitHub Actions triggers build workflow
4. **Release Creation**: Automated GitHub release with artifacts
5. **Tap Update**: Automated update of Homebrew Cask formula
6. **Verification**: Manual verification of installation process

### Rollback Strategy

1. **Git Tags**: Easy rollback to previous versions
2. **Release Management**: Ability to mark releases as pre-release
3. **Formula Reversion**: Quick reversion of Cask formula if needed

## Documentation

### User Documentation

1. **Installation Guide**: Step-by-step Homebrew installation
2. **Gatekeeper Bypass**: Detailed security bypass instructions
3. **Troubleshooting**: Common issues and solutions
4. **Update Process**: How to update via Homebrew

### Developer Documentation

1. **Build Instructions**: Local development and testing
2. **Release Process**: Step-by-step release procedures
3. **Tap Maintenance**: Managing the Homebrew tap repository
4. **CI/CD Configuration**: GitHub Actions setup and maintenance

## Correctness Properties

### Property 1: Version Consistency
**Validates: Requirements 6.1, 6.5**

For any release, the version number must be consistent across all artifacts:
- Git tag version matches Cargo.toml version
- DMG filename includes correct version
- Cask formula specifies correct version
- GitHub release tag matches version

### Property 2: Architecture Completeness
**Validates: Requirements 3.4, 4.6, 4.7**

For any release, both supported architectures must be available:
- x86_64 DMG artifact exists
- aarch64 DMG artifact exists
- Cask formula includes both architecture checksums
- Both DMGs contain valid application bundles

### Property 3: Checksum Integrity
**Validates: Requirements 3.5, 4.3**

For any DMG artifact, the SHA256 checksum must be accurate:
- Calculated checksum matches actual file content
- Cask formula checksum matches release artifact checksum
- Checksum file contains all artifact checksums

### Property 4: Installation Completeness
**Validates: Requirements 7.1, 7.4**

For any successful installation, all required files must be present:
- Application bundle exists in /Applications
- Bundle identifier matches expected value
- All required app resources are present
- App is launchable (may require Gatekeeper bypass)

### Property 5: Clean Uninstallation
**Validates: Requirements 7.3, 7.5**

For any uninstallation, all application files must be removed:
- Application bundle removed from /Applications
- Application support files cleaned up (if any)
- No orphaned files remain in system directories

## Implementation Notes

### Tauri-Specific Considerations

1. **Bundle Generation**: Tauri automatically generates proper macOS bundles
2. **Resource Handling**: Icons and assets properly included in bundle
3. **Configuration**: Tauri.conf.json properly configured for unsigned distribution
4. **Dependencies**: Rust and Node.js dependencies properly managed

### macOS-Specific Considerations

1. **File Associations**: Proper file type associations if needed
2. **Launch Services**: Integration with macOS Launch Services
3. **Spotlight Integration**: Proper metadata for Spotlight search
4. **Accessibility**: VoiceOver and accessibility support

### Homebrew-Specific Considerations

1. **Formula Standards**: Adherence to Homebrew Cask guidelines
2. **Naming Conventions**: Proper cask naming and structure
3. **Dependency Management**: Handling of system dependencies
4. **Update Mechanisms**: Proper version detection and updates

This design provides a comprehensive solution for distributing the Kube Ingress Launcher via Homebrew Cask while maintaining security and user experience standards for unsigned macOS applications.