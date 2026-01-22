# Homebrew Tap Setup Guide

This guide explains how the Homebrew tap is configured for Kube Ingress Launcher using a **dedicated tap repository**.

## Overview

The Cask formula lives in a separate repository: [homebrew-kube-ingress-launcher](https://github.com/wasilak/homebrew-kube-ingress-launcher)

This follows the traditional Homebrew tap convention where tap repositories are named with the `homebrew-` prefix.

## Repository Structure

**Main Repository** (`kube-ingress-launcher`):
```
kube-ingress-launcher/
├── src/
├── src-tauri/
├── docs/
└── ...
```

**Tap Repository** (`homebrew-kube-ingress-launcher`):
```
homebrew-kube-ingress-launcher/
├── Casks/
│   └── kube-ingress-launcher.rb    # Homebrew Cask formula
└── README.md
```

## How It Works

When users run:
```bash
brew tap wasilak/kube-ingress-launcher
```

Homebrew:
1. Automatically looks for `github.com/wasilak/homebrew-kube-ingress-launcher`
2. Clones the tap repository
3. Finds `Casks/kube-ingress-launcher.rb`
4. Uses that formula to install the app

The DMG files are downloaded from GitHub Releases in the main repository, not stored in the tap repository.

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

### Automated Updates (Recommended)

The tap is **automatically updated** when you create a new release! 🎉

Simply push a tag and the automation handles everything:

```bash
# Bump version and create tag
./scripts/bump-version.sh 0.2.0

# Push the tag (triggers release + tap update)
git push origin v0.2.0
```

The GitHub Actions workflow will:
1. Build DMG files and create release
2. Automatically update the tap repository with new version and checksums
3. Commit and push the changes

See [Automated Homebrew Updates](AUTOMATED_HOMEBREW_UPDATES.md) for full details.

### Manual Updates (Fallback)

If automation fails or you prefer manual control:

```bash
# From the main kube-ingress-launcher repository
./scripts/update-formula.sh 0.2.0

# Or specify the tap repository path explicitly
./scripts/update-formula.sh 0.2.0 /path/to/homebrew-kube-ingress-launcher
```

This script will:
1. Download checksums from the GitHub release
2. Update the version in the tap repository's `Casks/kube-ingress-launcher.rb`
3. Update the SHA256 checksums for both architectures
4. Commit the changes in the tap repository

Then push from the tap repository:
```bash
cd /path/to/homebrew-kube-ingress-launcher
git push origin main
```

## Manual Formula Update

If you prefer to update manually in the tap repository:

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

In the tap repository, edit `Casks/kube-ingress-launcher.rb`:

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
cd /path/to/homebrew-kube-ingress-launcher
git add Casks/kube-ingress-launcher.rb
git commit -m "chore: update Homebrew Cask formula to version 0.2.0"
git push origin main
```

## Testing the Formula

Before pushing to the tap repository, test the formula locally:

```bash
cd /path/to/homebrew-kube-ingress-launcher

# Audit the formula
brew audit --cask --online Casks/kube-ingress-launcher.rb

# Test installation from local file
brew install --cask Casks/kube-ingress-launcher.rb

# After pushing to GitHub, test from tap
brew reinstall --cask kube-ingress-launcher
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

## Benefits of Dedicated Tap Repository

✅ **Standard Convention** - Follows Homebrew's naming convention (`homebrew-` prefix)
✅ **Simpler Installation** - Users don't need to specify full URL
✅ **Cleaner Main Repo** - Keeps formula separate from application code
✅ **Easier Discovery** - Homebrew can find the tap automatically
✅ **Better Organization** - Clear separation of concerns

## Resources

- [Homebrew Cask Documentation](https://docs.brew.sh/Cask-Cookbook)
- [Homebrew Tap Documentation](https://docs.brew.sh/Taps)
- [Cask Formula Reference](https://docs.brew.sh/Cask-Cookbook#stanza-reference)
