# Release Process

This document describes the step-by-step process for creating a new release of Kube Ingress Launcher.

## Prerequisites

- Write access to the main repository
- Write access to the Homebrew tap repository (`homebrew-kube-ingress-launcher`)
- Git configured with your credentials
- All tests passing on the main branch

## Release Checklist

### 1. Prepare the Release

- [ ] Ensure all planned features and fixes are merged to `main`
- [ ] Run full test suite: `npm test && cd src-tauri && cargo test`
- [ ] Test the application locally: `npm run tauri dev`
- [ ] Build and test production build: `npm run tauri build`
- [ ] Update CHANGELOG.md with release notes (if applicable)
- [ ] Review and update README.md if needed

### 2. Version Bump

Update the version number in `src-tauri/Cargo.toml`:

```toml
[package]
name = "kube-ingress-desktop"
version = "X.Y.Z"  # Update this line
```

**Version Numbering** (Semantic Versioning):
- **MAJOR** (X): Breaking changes, incompatible API changes
- **MINOR** (Y): New features, backwards-compatible
- **PATCH** (Z): Bug fixes, backwards-compatible

Examples:
- `0.1.0` → `0.1.1` (bug fix)
- `0.1.1` → `0.2.0` (new feature)
- `0.2.0` → `1.0.0` (major release, breaking changes)

### 3. Commit Version Bump

```bash
# Commit the version change
git add src-tauri/Cargo.toml
git commit -m "chore: bump version to X.Y.Z"
git push origin main
```

### 4. Create and Push Git Tag

```bash
# Create annotated tag
git tag -a vX.Y.Z -m "Release vX.Y.Z"

# Push the tag to trigger CI/CD
git push origin vX.Y.Z
```

**Important**: The tag MUST start with `v` (e.g., `v1.0.0`) to trigger the release workflow.

### 5. Monitor CI/CD Pipeline

1. Go to [GitHub Actions](https://github.com/wasilak/kube-ingress-desktop/actions)
2. Watch the "Release" workflow run
3. The workflow will:
   - Build for both architectures (x86_64 and aarch64)
   - Create DMG files
   - Calculate SHA256 checksums
   - Create a GitHub Release
   - Upload DMG files and checksums

**Expected Duration**: 10-15 minutes

**If the workflow fails**:
- Check the workflow logs for errors
- Fix the issue
- Delete the tag: `git tag -d vX.Y.Z && git push origin :refs/tags/vX.Y.Z`
- Repeat from step 4

### 6. Verify GitHub Release

1. Go to [Releases page](https://github.com/wasilak/kube-ingress-desktop/releases)
2. Verify the new release is created with tag `vX.Y.Z`
3. Check that all artifacts are present:
   - `kube-ingress-launcher-X.Y.Z-x86_64-apple-darwin.dmg`
   - `kube-ingress-launcher-X.Y.Z-aarch64-apple-darwin.dmg`
   - `checksums-x86_64-apple-darwin.txt`
   - `checksums-aarch64-apple-darwin.txt`
4. Verify release notes are generated
5. Download one DMG and verify it opens correctly

### 7. Verify Homebrew Tap Update

The Homebrew tap should be automatically updated by the CI/CD pipeline (if configured).

**Manual verification**:

1. Go to the [Homebrew tap repository](https://github.com/wasilak/homebrew-kube-ingress-launcher)
2. Check that `Casks/kube-ingress-launcher.rb` has been updated with:
   - New version number
   - New SHA256 checksums
   - New download URLs

**If automatic update failed**, update manually:

```bash
# Clone the tap repository
git clone https://github.com/wasilak/homebrew-kube-ingress-launcher.git
cd homebrew-kube-ingress-launcher

# Download checksums from the release
curl -LO https://github.com/wasilak/kube-ingress-desktop/releases/download/vX.Y.Z/checksums-x86_64-apple-darwin.txt
curl -LO https://github.com/wasilak/kube-ingress-desktop/releases/download/vX.Y.Z/checksums-aarch64-apple-darwin.txt

# Extract checksums
INTEL_SHA=$(grep "kube-ingress-launcher" checksums-x86_64-apple-darwin.txt | cut -d' ' -f1)
ARM_SHA=$(grep "kube-ingress-launcher" checksums-aarch64-apple-darwin.txt | cut -d' ' -f1)

# Update the Cask formula
# Edit Casks/kube-ingress-launcher.rb:
# - Update version = "X.Y.Z"
# - Update sha256 arm: "$ARM_SHA"
# - Update sha256 intel: "$INTEL_SHA"

# Commit and push
git add Casks/kube-ingress-launcher.rb
git commit -m "Update kube-ingress-launcher to X.Y.Z"
git push origin main
```

### 8. Test Installation from Homebrew

Test the installation on a clean system (or use a VM):

```bash
# Add the tap
brew tap wasilak/kube-ingress-launcher

# Install the cask
brew install --cask kube-ingress-launcher

# Verify installation
ls -la /Applications/Kube\ Ingress\ Launcher.app

# Test the application launches
open /Applications/Kube\ Ingress\ Launcher.app
```

**Test checklist**:
- [ ] Application installs to `/Applications`
- [ ] Application launches (after Gatekeeper bypass)
- [ ] Application connects to Kubernetes cluster
- [ ] Search functionality works
- [ ] Global shortcut works (after granting Accessibility permission)
- [ ] Settings can be changed and persist

### 9. Announce the Release

After successful verification:

1. **Update main README.md** (if needed) with new features
2. **Post announcement** (if applicable):
   - Internal Slack/Discord
   - Twitter/social media
   - Blog post
3. **Close related issues** on GitHub
4. **Update project board** (if using one)

## Rollback Procedure

If a critical issue is discovered after release:

### Option 1: Quick Patch Release

1. Fix the issue on main branch
2. Bump to patch version (e.g., `1.0.0` → `1.0.1`)
3. Follow release process above

### Option 2: Revert to Previous Version

1. **Mark release as pre-release** on GitHub:
   - Go to the release page
   - Click "Edit"
   - Check "Set as a pre-release"
   - Add warning to release notes

2. **Revert Homebrew Cask** to previous version:
   ```bash
   cd homebrew-kube-ingress-launcher
   git revert HEAD
   git push origin main
   ```

3. **Notify users**:
   - Post announcement about the issue
   - Recommend downgrading: `brew reinstall --cask kube-ingress-launcher`

### Option 3: Delete Release (Last Resort)

Only use if the release is completely broken and was just published:

```bash
# Delete the GitHub release (via web UI)
# Delete the tag
git tag -d vX.Y.Z
git push origin :refs/tags/vX.Y.Z

# Revert Homebrew Cask
cd homebrew-kube-ingress-launcher
git revert HEAD
git push origin main
```

## Troubleshooting

### Build Fails for One Architecture

**Symptom**: Release workflow fails for x86_64 or aarch64

**Solution**:
- Check if Rust target is installed: `rustup target list --installed`
- Verify Tauri configuration supports both architectures
- Check build logs for specific errors
- May need to update dependencies

### DMG Creation Fails

**Symptom**: `create-dmg.sh` script fails

**Solution**:
- Verify app bundle was created by Tauri
- Check hdiutil is available (macOS only)
- Verify disk space is sufficient
- Check script has execute permissions

### Checksums Don't Match

**Symptom**: Downloaded DMG checksum doesn't match published checksum

**Solution**:
- Re-download the DMG (may have been corrupted)
- Verify you're using the correct checksum file for your architecture
- Check if the release was updated after initial publication

### Homebrew Installation Fails

**Symptom**: `brew install --cask kube-ingress-launcher` fails

**Solution**:
- Verify the Cask formula syntax: `brew style Casks/kube-ingress-launcher.rb`
- Check download URLs are accessible
- Verify checksums match the actual DMG files
- Test formula locally: `brew install --cask --debug Casks/kube-ingress-launcher.rb`

### Gatekeeper Blocks Application

**Symptom**: macOS refuses to open the application even after "Open Anyway"

**Solution**:
- This is expected for unsigned applications
- Provide clear instructions in README
- Consider code signing in future (requires Apple Developer account)
- Users can also use: `xattr -cr /Applications/Kube\ Ingress\ Launcher.app`

## Release Frequency

**Recommended schedule**:
- **Patch releases**: As needed for critical bugs (within days)
- **Minor releases**: Monthly or when significant features are ready
- **Major releases**: Quarterly or when breaking changes are necessary

## Version History

Track major releases here:

- `v0.1.0` - Initial release
- `v1.0.0` - First stable release with Homebrew distribution

## Notes

- Always test on both Intel and Apple Silicon Macs if possible
- Keep release notes clear and user-focused
- Include migration guides for breaking changes
- Monitor GitHub issues after release for problems
- Consider beta releases for major versions

## Automation Improvements

Future improvements to consider:
- Automatic Homebrew tap updates via CI/CD
- Automated testing on release candidates
- Beta/pre-release channels
- Automatic changelog generation
- Release notification system
