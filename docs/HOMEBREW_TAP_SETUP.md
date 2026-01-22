# Homebrew Tap Setup Guide

This guide explains how the Homebrew tap is configured for Kube Ingress Launcher using the **same repository** approach.

## Overview

The Cask formula lives in the main repository under the `Casks/` directory. This simplifies maintenance by keeping everything in one place—no separate tap repository needed!

## Repository Structure

```
kube-ingress-launcher/
├── Casks/
│   └── kube-ingress-launcher.rb    # Homebrew Cask formula
├── src/
├── src-tauri/
├── docs/
└── ...
```

## How It Works

When users run:
```bash
brew tap wasilak/kube-ingress-launcher
```

Homebrew:
1. Clones the main `kube-ingress-launcher` repository
2. Looks for the `Casks/` directory
3. Finds `kube-ingress-launcher.rb`
4. Uses that formula to install the app

The DMG files are downloaded from GitHub Releases, not stored in the repository.

## Installation for Users

```bash
# Add the tap
brew tap wasilak/kube-ingress-launcher

# Install the cask
brew install --cask kube-ingress-launcher

# Update to latest version
brew upgrade --cask kube-ingress-launcher

# Uninstall
brew uninstall --cask kube-ingress-launcher
```

## Updating the Formula

After creating a new release, update the formula with the new version and checksums:

```bash
./scripts/update-formula.sh 0.2.0
```

This script will:
1. Download checksums from the GitHub release
2. Update the version in `Casks/kube-ingress-launcher.rb`
3. Update the SHA256 checksums for both architectures
4. Commit the changes

Then push:
```bash
git push origin main
```

## Manual Formula Update

If you prefer to update manually:

### 1. Download Checksums

```bash
# Download checksum files from GitHub release
curl -LO https://github.com/wasilak/kube-ingress-launcher/releases/download/v0.2.0/checksums-x86_64-apple-darwin.txt
curl -LO https://github.com/wasilak/kube-ingress-launcher/releases/download/v0.2.0/checksums-aarch64-apple-darwin.txt

# Extract checksums
INTEL_SHA=$(grep "kube-ingress-launcher.*x86_64.*\.dmg" checksums-x86_64-apple-darwin.txt | awk '{print $1}')
ARM_SHA=$(grep "kube-ingress-launcher.*aarch64.*\.dmg" checksums-aarch64-apple-darwin.txt | awk '{print $1}')

echo "Intel SHA256: $INTEL_SHA"
echo "ARM SHA256: $ARM_SHA"
```

### 2. Update the Cask File

Edit `Casks/kube-ingress-launcher.rb`:

```ruby
cask "kube-ingress-launcher" do
  version "0.2.0"  # Update this
  
  arch arm: "aarch64", intel: "x86_64"
  
  url "https://github.com/wasilak/kube-ingress-launcher/releases/download/v#{version}/kube-ingress-launcher-#{version}-#{arch}-apple-darwin.dmg"
  sha256 arm:   "ACTUAL_ARM64_SHA256_HERE",      # Update this
         intel: "ACTUAL_X86_64_SHA256_HERE"     # Update this
  
  # ... rest of the file
end
```

### 3. Commit and Push

```bash
git add Casks/kube-ingress-launcher.rb
git commit -m "chore: update Homebrew Cask formula to version 0.2.0"
git push origin main
```

## Testing the Formula

Before pushing, test the formula locally:

```bash
# Audit the formula
brew audit --cask --online Casks/kube-ingress-launcher.rb

# Test installation (if you have the tap already)
brew reinstall --cask kube-ingress-launcher

# Or test from local file
brew install --cask Casks/kube-ingress-launcher.rb
```

## Formula Anatomy

The Cask formula contains:

```ruby
cask "kube-ingress-launcher" do
  version "0.1.0"                    # Version number
  
  arch arm: "aarch64", intel: "x86_64"  # Architecture mapping
  
  url "https://..."                  # Download URL (uses #{version} and #{arch})
  sha256 arm: "...", intel: "..."    # SHA256 checksums for verification
  
  name "Kube Ingress Launcher"       # Display name
  desc "..."                         # Short description
  homepage "..."                     # Project homepage
  
  livecheck do                       # Auto-update checking
    url :url
    strategy :github_latest
  end
  
  app "Kube Ingress Launcher.app"    # What to install
  
  zap trash: [...]                   # Files to remove on uninstall
  
  caveats <<~EOS                     # Post-install message
    ...
  EOS
end
```

## Troubleshooting

### Formula Not Found

If users get "formula not found" error:

```bash
# Update Homebrew
brew update

# Re-tap
brew untap wasilak/kube-ingress-launcher
brew tap wasilak/kube-ingress-launcher
```

### Checksum Mismatch

If checksums don't match:

1. Verify the release has the correct DMG files
2. Re-download checksums from GitHub
3. Update the formula with correct checksums
4. Push the update

### Installation Fails

Common issues:
- **403 Error**: Release doesn't exist or is private
- **404 Error**: DMG file not found at the URL
- **Checksum Error**: SHA256 doesn't match the downloaded file

## Benefits of Same-Repo Approach

✅ **Simpler** - One repository to maintain
✅ **Atomic updates** - Formula updates happen with code changes
✅ **Easier CI/CD** - Can update formula in the same workflow
✅ **Version sync** - Formula version always matches code version
✅ **Less overhead** - No separate repository to manage

## Resources

- [Homebrew Cask Documentation](https://docs.brew.sh/Cask-Cookbook)
- [Homebrew Tap Documentation](https://docs.brew.sh/Taps)
- [Cask Formula Reference](https://docs.brew.sh/Cask-Cookbook#stanza-reference)
