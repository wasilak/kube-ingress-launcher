# Automated Homebrew Tap Updates

This document explains how the Homebrew tap is automatically updated when you create a new release.

## Overview

When you create a new release in the main repository, a GitHub Actions workflow automatically:
1. Downloads the checksums from the release
2. Updates the Cask formula in the tap repository
3. Commits and pushes the changes

**No manual intervention required!** 🎉

## How It Works

### 1. Release Workflow (`.github/workflows/release.yml`)

When you push a tag (e.g., `v0.2.0`):
- Builds a universal DMG file (works on both Intel and Apple Silicon)
- Calculates SHA256 checksum
- Creates a GitHub release with DMG file and checksum file

### 2. Tap Update Workflow (`.github/workflows/update-homebrew-tap.yml`)

When a release is published:
- Triggers automatically via `release: published` event
- Downloads checksum from the release
- Checks out the tap repository
- Updates `Casks/kube-ingress-launcher.rb` with:
  - New version number
  - New SHA256 checksum
- Commits and pushes to the tap repository

## Setup Requirements

### GitHub Personal Access Token

The automation requires a Personal Access Token (PAT) with write access to the tap repository.

#### Creating the Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Name: `Homebrew Tap Updates`
4. Expiration: Choose appropriate duration (recommend 1 year)
5. Scopes: Select `repo` (Full control of private repositories)
6. Click "Generate token"
7. **Copy the token immediately** (you won't see it again!)

#### Adding the Token to Repository

1. Go to your main repository: `wasilak/kube-ingress-launcher`
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `TAP_GITHUB_TOKEN`
5. Value: Paste your PAT
6. Click "Add secret"

## Creating a New Release

### Automated Process (Recommended)

Use the version bump script:

```bash
# Bump version and create release
./scripts/bump-version.sh 0.2.0

# Push the tag
git push origin v0.2.0
```

This will:
1. ✅ Update version in `Cargo.toml` and `tauri.conf.json`
2. ✅ Commit the changes
3. ✅ Create a git tag
4. ✅ Trigger the release workflow (builds DMGs, creates release)
5. ✅ Trigger the tap update workflow (updates Homebrew formula)

### Manual Process

If you prefer to create releases manually:

```bash
# 1. Update version numbers
./scripts/bump-version.sh 0.2.0

# 2. Commit and tag
git add .
git commit -m "chore: bump version to 0.2.0"
git tag -a v0.2.0 -m "Release version 0.2.0"

# 3. Push tag (this triggers everything)
git push origin v0.2.0
```

## Workflow Sequence

```
1. Developer pushes tag (v0.2.0)
   ↓
2. Release workflow runs
   - Builds universal DMG file
   - Calculates checksum
   - Creates GitHub release
   ↓
3. Release is published
   ↓
4. Tap update workflow triggers
   - Downloads checksum
   - Updates Cask formula
   - Commits to tap repository
   ↓
5. Users can update
   - brew update
   - brew upgrade --cask kube-ingress-launcher
```

## Monitoring

### Check Workflow Status

1. Go to Actions tab in GitHub
2. Look for "Update Homebrew Tap" workflow
3. Click on the latest run to see details

### Verify Tap Update

Check the tap repository to confirm the update:
```bash
# View the latest commit
git -C /path/to/homebrew-kube-ingress-launcher log -1

# Or check on GitHub
# https://github.com/wasilak/homebrew-kube-ingress-launcher/commits/main
```

### Test Installation

After the workflow completes:
```bash
brew update
brew upgrade --cask kube-ingress-launcher
```

## Troubleshooting

### Workflow Fails: "Failed to download checksums"

**Cause**: Release was created but checksum files aren't available yet.

**Solution**: 
- Wait a few seconds for the release workflow to complete
- The tap update workflow will retry automatically
- Or manually re-run the workflow from the Actions tab

### Workflow Fails: "Authentication failed"

**Cause**: `TAP_GITHUB_TOKEN` secret is missing or invalid.

**Solution**:
1. Verify the secret exists in repository settings
2. Check token hasn't expired
3. Ensure token has `repo` scope
4. Create a new token if needed

### Workflow Fails: "Failed to extract checksums"

**Cause**: Checksum file format doesn't match expected pattern.

**Solution**:
- Check the checksum files in the release
- Ensure they follow the format: `<sha256>  kube-ingress-launcher-<version>-<arch>.dmg`
- Verify the release workflow completed successfully

### Formula Not Updated

**Cause**: Workflow didn't trigger or failed silently.

**Solution**:
1. Check Actions tab for workflow runs
2. Manually trigger the workflow:
   - Go to Actions → Update Homebrew Tap
   - Click "Run workflow"
   - Select the release tag
3. Or use the manual update script:
   ```bash
   ./scripts/update-formula.sh 0.2.0
   ```

## Manual Override

If automation fails, you can always update manually:

```bash
# Update the tap formula manually
./scripts/update-formula.sh 0.2.0

# Or directly in the tap repository
cd /path/to/homebrew-kube-ingress-launcher
# Edit Casks/kube-ingress-launcher.rb
git add Casks/kube-ingress-launcher.rb
git commit -m "chore: update to version 0.2.0"
git push origin main
```

## Benefits

✅ **Fully Automated** - No manual steps after pushing a tag
✅ **Consistent** - Same process every time
✅ **Fast** - Updates within minutes of release
✅ **Reliable** - Checksums verified automatically
✅ **Traceable** - Full audit trail in GitHub Actions
✅ **Fallback** - Manual script available if needed

## Security Notes

- The `TAP_GITHUB_TOKEN` has write access to the tap repository only
- Token is stored as an encrypted secret in GitHub
- Workflow runs in isolated environment
- All changes are committed with bot account
- Full audit trail in both repositories

## Future Enhancements

Possible improvements:
- Add Slack/Discord notifications on successful updates
- Create PR instead of direct push for review
- Add automated testing of the formula before pushing
- Support for multiple tap repositories
- Rollback mechanism for failed updates

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Homebrew Cask Documentation](https://docs.brew.sh/Cask-Cookbook)
- [Creating Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
