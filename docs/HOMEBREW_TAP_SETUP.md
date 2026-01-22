# Homebrew Tap Setup Guide

This guide explains how to set up the Homebrew tap repository for Kube Ingress Launcher distribution.

## Overview

A Homebrew "tap" is a third-party repository that contains Homebrew formulas (for CLI tools) or Casks (for GUI applications). This allows users to install your application with a simple `brew install` command.

## Prerequisites

- GitHub account with permission to create repositories
- Git installed and configured
- Basic understanding of Homebrew and Ruby syntax

## Step 1: Create the Tap Repository

### 1.1 Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository with the name: `homebrew-kube-ingress-launcher`
   - **Important**: The name MUST start with `homebrew-` for Homebrew to recognize it as a tap
3. Set visibility to **Public** (required for Homebrew taps)
4. Initialize with a README (optional, we'll replace it)
5. Click **Create repository**

### 1.2 Clone the Repository

```bash
git clone https://github.com/wasilak/homebrew-kube-ingress-launcher.git
cd homebrew-kube-ingress-launcher
```

## Step 2: Set Up Repository Structure

### 2.1 Create Directory Structure

```bash
# Create Casks directory (for GUI applications)
mkdir -p Casks

# Copy example files from main repository
cp ../kube-ingress-launcher/docs/homebrew-tap-example/Casks/kube-ingress-launcher.rb Casks/
cp ../kube-ingress-launcher/docs/homebrew-tap-example/README.md .
cp ../kube-ingress-launcher/docs/homebrew-tap-example/.gitignore .
```

### 2.2 Directory Structure

Your tap repository should look like this:

```
homebrew-kube-ingress-launcher/
├── Casks/
│   └── kube-ingress-launcher.rb
├── .gitignore
└── README.md
```

## Step 3: Update the Cask Formula

### 3.1 Get SHA256 Checksums

After creating your first release (v0.1.0), download the checksums:

```bash
# Download checksum files
curl -LO https://github.com/wasilak/kube-ingress-launcher/releases/download/v0.1.0/checksums-x86_64-apple-darwin.txt
curl -LO https://github.com/wasilak/kube-ingress-launcher/releases/download/v0.1.0/checksums-aarch64-apple-darwin.txt

# Extract checksums
INTEL_SHA=$(grep "kube-ingress-launcher" checksums-x86_64-apple-darwin.txt | cut -d' ' -f1)
ARM_SHA=$(grep "kube-ingress-launcher" checksums-aarch64-apple-darwin.txt | cut -d' ' -f1)

echo "Intel SHA256: $INTEL_SHA"
echo "ARM SHA256: $ARM_SHA"
```

### 3.2 Update Casks/kube-ingress-launcher.rb

Edit `Casks/kube-ingress-launcher.rb` and replace the placeholders:

```ruby
cask "kube-ingress-launcher" do
  version "0.1.0"  # Update this with your version
  
  arch arm: "aarch64", intel: "x86_64"
  
  url "https://github.com/wasilak/kube-ingress-launcher/releases/download/v#{version}/kube-ingress-launcher-#{version}-#{arch}-apple-darwin.dmg"
  sha256 arm:   "ACTUAL_ARM64_SHA256_HERE",      # Replace with $ARM_SHA
         intel: "ACTUAL_X86_64_SHA256_HERE"     # Replace with $INTEL_SHA
  
  # ... rest of the file
end
```

## Step 4: Test the Cask Formula

### 4.1 Validate Syntax

```bash
# Check Ruby syntax
brew style Casks/kube-ingress-launcher.rb

# Audit the cask
brew audit --cask Casks/kube-ingress-launcher.rb
```

### 4.2 Test Installation Locally

```bash
# Install from local file
brew install --cask Casks/kube-ingress-launcher.rb

# Verify installation
ls -la /Applications/Kube\ Ingress\ Launcher.app

# Uninstall
brew uninstall --cask kube-ingress-launcher
```

### 4.3 Test from Tap

```bash
# Add your tap
brew tap wasilak/kube-ingress-launcher

# Install from tap
brew install --cask kube-ingress-launcher

# Verify
brew list --cask kube-ingress-launcher
```

## Step 5: Commit and Push

```bash
git add Casks/kube-ingress-launcher.rb README.md .gitignore
git commit -m "Initial Cask formula for kube-ingress-launcher v0.1.0"
git push origin main
```

## Step 6: Automate Updates (Optional)

### 6.1 Create Update Script in Main Repository

Create `scripts/update-formula.sh` in the main repository:

```bash
#!/bin/bash
# scripts/update-formula.sh
# Updates the Homebrew Cask formula with new version and checksums

set -e

# Configuration
TAP_REPO="git@github.com:wasilak/homebrew-kube-ingress-launcher.git"
TAP_DIR="homebrew-kube-ingress-launcher"
CASK_FILE="Casks/kube-ingress-launcher.rb"

# Get version from Cargo.toml
VERSION=$(./scripts/get-version.sh)
echo "Updating formula for version: $VERSION"

# Download checksums from GitHub release
echo "Downloading checksums..."
curl -sL "https://github.com/wasilak/kube-ingress-launcher/releases/download/v${VERSION}/checksums-x86_64-apple-darwin.txt" -o checksums-intel.txt
curl -sL "https://github.com/wasilak/kube-ingress-launcher/releases/download/v${VERSION}/checksums-aarch64-apple-darwin.txt" -o checksums-arm.txt

# Extract checksums
INTEL_SHA=$(grep "kube-ingress-launcher" checksums-intel.txt | cut -d' ' -f1)
ARM_SHA=$(grep "kube-ingress-launcher" checksums-arm.txt | cut -d' ' -f1)

echo "Intel SHA256: $INTEL_SHA"
echo "ARM SHA256: $ARM_SHA"

# Clone tap repository if not exists
if [ ! -d "$TAP_DIR" ]; then
    echo "Cloning tap repository..."
    git clone "$TAP_REPO" "$TAP_DIR"
fi

cd "$TAP_DIR"
git pull origin main

# Update the Cask formula
echo "Updating Cask formula..."
sed -i.bak "s/version \".*\"/version \"$VERSION\"/" "$CASK_FILE"
sed -i.bak "s/arm:   \".*\"/arm:   \"$ARM_SHA\"/" "$CASK_FILE"
sed -i.bak "s/intel: \".*\"/intel: \"$INTEL_SHA\"/" "$CASK_FILE"
rm "${CASK_FILE}.bak"

# Commit and push
git add "$CASK_FILE"
git commit -m "Update kube-ingress-launcher to $VERSION"
git push origin main

echo "Formula updated successfully!"

# Cleanup
cd ..
rm checksums-intel.txt checksums-arm.txt
```

Make it executable:

```bash
chmod +x scripts/update-formula.sh
```

### 6.2 Test the Update Script

```bash
./scripts/update-formula.sh
```

## Step 7: User Instructions

Users can now install your application with:

```bash
# Add the tap
brew tap wasilak/kube-ingress-launcher

# Install the application
brew install --cask kube-ingress-launcher
```

## Updating for New Releases

When you release a new version:

### Manual Update

1. Download new checksums from the release
2. Update `Casks/kube-ingress-launcher.rb`:
   - Change `version` line
   - Update `sha256` checksums
3. Commit and push

### Automated Update

Run the update script:

```bash
./scripts/update-formula.sh
```

## Troubleshooting

### Cask Audit Fails

**Symptom**: `brew audit` reports errors

**Solutions**:
- Check Ruby syntax: `ruby -c Casks/kube-ingress-launcher.rb`
- Verify URLs are accessible
- Ensure checksums match actual DMG files
- Check Homebrew Cask style guide: https://docs.brew.sh/Cask-Cookbook

### Installation Fails

**Symptom**: `brew install --cask` fails

**Solutions**:
- Verify DMG files exist at the URLs
- Check checksums match
- Test DMG can be mounted: `hdiutil attach <dmg-file>`
- Check Homebrew logs: `brew install --cask --debug kube-ingress-launcher`

### Tap Not Found

**Symptom**: `brew tap wasilak/kube-ingress-launcher` fails

**Solutions**:
- Verify repository name starts with `homebrew-`
- Ensure repository is public
- Check repository exists: https://github.com/wasilak/homebrew-kube-ingress-launcher
- Try full URL: `brew tap wasilak/kube-ingress-launcher https://github.com/wasilak/homebrew-kube-ingress-launcher`

### Checksum Mismatch

**Symptom**: Installation fails with "SHA256 mismatch"

**Solutions**:
- Re-download the DMG and recalculate checksum
- Verify you're using the correct checksum for the architecture
- Check if the release was updated after initial publication
- Ensure the DMG wasn't corrupted during upload

## Best Practices

1. **Always test locally** before pushing to the tap repository
2. **Verify checksums** match the actual DMG files
3. **Keep README updated** with installation instructions
4. **Use semantic versioning** for releases
5. **Test on both architectures** if possible (Intel and Apple Silicon)
6. **Document breaking changes** in release notes
7. **Respond to issues** promptly in the tap repository

## Resources

- [Homebrew Cask Documentation](https://docs.brew.sh/Cask-Cookbook)
- [Homebrew Tap Documentation](https://docs.brew.sh/Taps)
- [Homebrew Formula Cookbook](https://docs.brew.sh/Formula-Cookbook)
- [Homebrew Style Guide](https://docs.brew.sh/Formula-Cookbook#style-guide)

## Example Taps

Study these popular taps for reference:
- https://github.com/homebrew/homebrew-cask
- https://github.com/homebrew/homebrew-core
- https://github.com/mongodb/homebrew-brew

## Support

For issues with the tap setup:
- Open an issue in the tap repository
- Check Homebrew documentation
- Ask in Homebrew Discussions: https://github.com/orgs/Homebrew/discussions

For issues with the application:
- Open an issue in the main repository: https://github.com/wasilak/kube-ingress-launcher/issues
