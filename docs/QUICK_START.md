# Quick Start Guide - Homebrew Cask Distribution

This guide will get you from zero to a published Homebrew Cask in under 30 minutes.

## Prerequisites

- ✅ All implementation is complete (see `IMPLEMENTATION_SUMMARY.md`)
- ✅ GitHub account with repository access
- ✅ Git configured locally
- ✅ Homebrew installed (for testing)

## Step 1: Create Homebrew Tap Repository (5 minutes)

### 1.1 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `homebrew-kube-ingress-launcher`
3. Description: "Homebrew tap for Kube Ingress Launcher"
4. Visibility: **Public** (required)
5. Click "Create repository"

### 1.2 Initialize Repository

```bash
# Clone the new repository
git clone https://github.com/wasilak/homebrew-kube-ingress-launcher.git
cd homebrew-kube-ingress-launcher

# Create directory structure
mkdir -p Casks

# Copy example files from main repository
cp ../kube-ingress-desktop/docs/homebrew-tap-example/Casks/kube-ingress-launcher.rb Casks/
cp ../kube-ingress-desktop/docs/homebrew-tap-example/README.md .
cp ../kube-ingress-desktop/docs/homebrew-tap-example/.gitignore .

# Commit and push
git add .
git commit -m "Initial Homebrew Cask formula"
git push origin main
```

✅ **Checkpoint**: Tap repository is created and initialized

## Step 2: Create First Release (10 minutes)

### 2.1 Bump Version

```bash
cd ../kube-ingress-desktop

# Edit src-tauri/Cargo.toml
# Change version = "0.1.0" to version = "1.0.0"

# Commit the version bump
git add src-tauri/Cargo.toml
git commit -m "chore: bump version to 1.0.0"
git push origin main
```

### 2.2 Create and Push Tag

```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release v1.0.0 - First stable release with Homebrew distribution"

# Push the tag (this triggers CI/CD)
git push origin v1.0.0
```

### 2.3 Monitor CI/CD

1. Go to https://github.com/wasilak/kube-ingress-desktop/actions
2. Watch the "Release" workflow
3. Wait for completion (10-15 minutes)

✅ **Checkpoint**: Release workflow completes successfully

## Step 3: Update Homebrew Formula (5 minutes)

### 3.1 Run Update Script

```bash
# From the main repository
./scripts/update-formula.sh
```

This script will:
- Extract version from Cargo.toml
- Download checksums from GitHub release
- Update the Cask formula
- Commit and push changes

### 3.2 Verify Update

```bash
cd ../homebrew-kube-ingress-launcher
git pull
cat Casks/kube-ingress-launcher.rb
```

Verify:
- Version is `1.0.0`
- SHA256 checksums are real (not placeholders)
- URLs point to the correct release

✅ **Checkpoint**: Formula is updated with real checksums

## Step 4: Test Installation (10 minutes)

### 4.1 Add Tap

```bash
brew tap wasilak/kube-ingress-launcher
```

### 4.2 Install Application

```bash
brew install --cask kube-ingress-launcher
```

### 4.3 Verify Installation

```bash
# Check installation
ls -la /Applications/Kube\ Ingress\ Launcher.app

# Verify bundle identifier
defaults read /Applications/Kube\ Ingress\ Launcher.app/Contents/Info.plist CFBundleIdentifier
# Should output: foo.otteryak.kube-ingress-desktop
```

### 4.4 Bypass Gatekeeper

1. Try to open the app from `/Applications`
2. macOS will show security warning
3. Go to **System Settings** > **Privacy & Security**
4. Click **"Open Anyway"**
5. Confirm by clicking **"Open"**

### 4.5 Test Application

1. Grant Accessibility permission when prompted
2. Verify app launches
3. Test global shortcut (Cmd+Shift+K)
4. Verify Kubernetes connection works
5. Test search functionality

✅ **Checkpoint**: Application installs and works correctly

## Step 5: Announce Release (5 minutes)

### 5.1 Update Main README

Ensure the README has the Homebrew installation instructions (already done).

### 5.2 Create Release Announcement

Post to:
- GitHub Discussions (if enabled)
- Internal Slack/Discord
- Social media (if applicable)

Example announcement:

```
🎉 Kube Ingress Launcher v1.0.0 is now available!

Install via Homebrew:
  brew tap wasilak/kube-ingress-launcher
  brew install --cask kube-ingress-launcher

Features:
- Spotlight-like search for Kubernetes ingresses
- Global keyboard shortcut (Cmd+Shift+K)
- Menu bar application
- Background refresh

Download: https://github.com/wasilak/kube-ingress-desktop/releases/tag/v1.0.0
```

✅ **Checkpoint**: Release is announced

## Troubleshooting

### Release Workflow Fails

**Check**:
- GitHub Actions logs for errors
- Rust and Node.js versions in workflow
- DMG script has execute permissions

**Fix**:
- Delete tag: `git tag -d v1.0.0 && git push origin :refs/tags/v1.0.0`
- Fix the issue
- Recreate tag and push

### Formula Update Script Fails

**Check**:
- Release exists on GitHub
- Checksum files are present in release
- Tap repository is accessible

**Fix**:
- Verify release URL: `https://github.com/wasilak/kube-ingress-desktop/releases/tag/v1.0.0`
- Check checksums exist
- Manually update formula if needed

### Installation Fails

**Check**:
- Tap is added: `brew tap`
- Formula syntax: `brew style Casks/kube-ingress-launcher.rb`
- Download URLs are accessible

**Fix**:
- Re-add tap: `brew untap wasilak/kube-ingress-launcher && brew tap wasilak/kube-ingress-launcher`
- Verify checksums match DMG files
- Check Homebrew logs: `brew install --cask --debug kube-ingress-launcher`

### Gatekeeper Won't Allow App

**Check**:
- Followed bypass steps correctly
- "Open Anyway" button appears in System Settings

**Fix**:
- Try right-click method
- Use command line: `xattr -cr /Applications/Kube\ Ingress\ Launcher.app`
- See `docs/GATEKEEPER_BYPASS.md` for detailed instructions

## Next Release

For subsequent releases:

```bash
# 1. Bump version in Cargo.toml
# 2. Commit and push
git commit -am "chore: bump version to X.Y.Z"
git push origin main

# 3. Create and push tag
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z

# 4. Wait for CI/CD to complete

# 5. Update formula
./scripts/update-formula.sh

# 6. Test upgrade
brew upgrade --cask kube-ingress-launcher
```

## Success Checklist

- [ ] Tap repository created and public
- [ ] First release (v1.0.0) created successfully
- [ ] DMG files uploaded to GitHub Release
- [ ] Checksums calculated and uploaded
- [ ] Formula updated with real checksums
- [ ] Installation works: `brew install --cask kube-ingress-launcher`
- [ ] App installs to `/Applications`
- [ ] Gatekeeper bypass works
- [ ] App launches and functions correctly
- [ ] Global shortcut works (after Accessibility permission)
- [ ] Kubernetes connection works
- [ ] Search functionality works
- [ ] Release announced

## Time Estimate

- **Setup**: 5 minutes (tap repository)
- **First Release**: 10 minutes (+ 10-15 min CI/CD wait)
- **Formula Update**: 5 minutes
- **Testing**: 10 minutes
- **Announcement**: 5 minutes

**Total**: ~35 minutes (+ CI/CD wait time)

## Resources

- **Full Documentation**: See `docs/` directory
- **Release Process**: `RELEASING.md`
- **Gatekeeper Guide**: `docs/GATEKEEPER_BYPASS.md`
- **Tap Setup**: `docs/HOMEBREW_TAP_SETUP.md`
- **Implementation Summary**: `docs/IMPLEMENTATION_SUMMARY.md`

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review detailed documentation in `docs/`
3. Check GitHub Actions logs
4. Open an issue on GitHub

## Congratulations! 🎉

You've successfully set up Homebrew Cask distribution for Kube Ingress Launcher!

Users can now install your application with a simple:
```bash
brew install --cask kube-ingress-launcher
```

Enjoy the streamlined distribution process!
