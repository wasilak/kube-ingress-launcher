# Release Process

This document describes how to create a new release of Kube Ingress Launcher.

## Quick Release

Use the automated script:

```bash
./scripts/bump-version.sh 0.2.0
```

This will:
1. Update version in `Cargo.toml` and `tauri.conf.json`
2. Rebuild to update `Cargo.lock`
3. Commit the changes
4. Create a git tag

Then push:
```bash
git push origin main
git push origin v0.2.0
```

## Manual Release Process

If you prefer to do it manually:

### 1. Update Version

Edit `src-tauri/Cargo.toml`:
```toml
[package]
version = "0.2.0"  # Update this
```

Edit `src-tauri/tauri.conf.json`:
```json
{
  "version": "0.2.0"  # Update this
}
```

### 2. Rebuild

```bash
cargo build --manifest-path src-tauri/Cargo.toml
```

### 3. Commit and Tag

```bash
git add src-tauri/Cargo.toml src-tauri/tauri.conf.json src-tauri/Cargo.lock
git commit -m "chore: bump version to 0.2.0"
git tag v0.2.0
```

### 4. Push

```bash
git push origin main
git push origin v0.2.0
```

## Semantic Versioning

Follow [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH):

- **PATCH** (0.1.0 → 0.1.1): Bug fixes only
  - No new features
  - No breaking changes
  - Example: Fix crash on startup

- **MINOR** (0.1.0 → 0.2.0): New features, backward compatible
  - Add new functionality
  - No breaking changes
  - Example: Add new keyboard shortcut customization

- **MAJOR** (0.9.0 → 1.0.0): Breaking changes
  - API changes
  - Removed features
  - Changed behavior
  - Example: Change settings file format

### Pre-1.0.0 Versions

Before 1.0.0, the API is considered unstable:
- 0.x.y versions may include breaking changes in MINOR updates
- Use 1.0.0 when the API is stable and production-ready

## What Happens After Pushing a Tag

When you push a tag (e.g., `v0.2.0`), GitHub Actions automatically:

1. **Builds the application** as a universal binary:
   - Works on both Apple Silicon (M1/M2/M3) and Intel Macs
   - Single DMG file for all architectures

2. **Creates DMG file**:
   - `kube-ingress-launcher-0.2.0-universal-apple-darwin.dmg`

3. **Generates checksum**:
   - `checksums.txt`

4. **Creates and publishes a GitHub Release**:
   - Release title: `v0.2.0`
   - Uploads DMG file and checksum
   - Generates formatted changelog using [git-cliff](https://git-cliff.org/) based on conventional commits

5. **Updates Homebrew Tap automatically** 🎉:
   - Downloads checksum from the release
   - Updates the Cask formula with new version and checksum
   - Commits and pushes to the tap repository

**Everything is automated!** No manual intervention needed after pushing the tag.

## Homebrew Tap Updates

The Homebrew tap is **automatically updated** when you publish a release! 🎉

The automation workflow:
1. Triggers when a release is published
2. Downloads checksums from the release
3. Updates the Cask formula in the tap repository
4. Commits and pushes the changes

**No manual action required!**

### Manual Override (if needed)

If automation fails, you can update manually:

```bash
./scripts/update-formula.sh 0.2.0
```

See [Automated Homebrew Updates](AUTOMATED_HOMEBREW_UPDATES.md) for full details and troubleshooting.

## Release Checklist

Before creating a release:

- [ ] All tests pass: `npm test && cargo test --manifest-path src-tauri/Cargo.toml`
- [ ] Application builds: `npm run tauri build`
- [ ] Application runs correctly: `npm run tauri dev`
- [ ] Version follows semantic versioning
- [ ] All commits follow [Conventional Commits](https://www.conventionalcommits.org/) format
- [ ] Documentation updated for new features
- [ ] No uncommitted changes
- [ ] Preview changelog: `git cliff --unreleased --strip header`

After pushing the tag:

- [ ] Wait for GitHub Actions to complete (both release and tap update)
- [ ] Verify DMG file is created in the release
- [ ] Verify Homebrew tap was updated automatically
- [ ] Test Homebrew installation: `brew update && brew upgrade --cask kube-ingress-launcher`
- [ ] Download and test DMG file (works on both Intel and Apple Silicon)
- [ ] Announce the release (if applicable)

## Troubleshooting

### Tag Already Exists

If you need to recreate a tag:

```bash
# Delete local tag
git tag -d v0.2.0

# Delete remote tag
git push origin :refs/tags/v0.2.0

# Create new tag
git tag v0.2.0
git push origin v0.2.0
```

### GitHub Actions Failed

1. Check the Actions tab on GitHub
2. Review the error logs
3. Fix the issue
4. Delete and recreate the tag (see above)

### Wrong Version Number

If you pushed the wrong version:

1. Delete the tag (see above)
2. Revert the commit: `git revert HEAD`
3. Run the bump script again with correct version
4. Push the new tag

## Version History

Track your releases:

- `v0.1.0` - Initial release
- `v0.2.0` - Added feature X
- `v0.2.1` - Fixed bug Y
- `v1.0.0` - First stable release

## Changelog Generation

This project uses [git-cliff](https://git-cliff.org/) to automatically generate changelogs for releases.

### Conventional Commits

All commits should follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```bash
# Features
git commit -m "feat: add keyboard shortcut customization"
git commit -m "feat(ui): add dark mode toggle"

# Bug fixes
git commit -m "fix: resolve crash on startup"
git commit -m "fix(search): handle empty search results"

# Breaking changes
git commit -m "feat!: change settings file format"
```

### Preview Changelog

Before releasing, preview what the changelog will look like:

```bash
# Install git-cliff
brew install git-cliff

# Preview next release notes
git cliff --unreleased --strip header
```

See [GIT_CLIFF.md](GIT_CLIFF.md) for detailed documentation on changelog generation.

## Resources

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [git-cliff Documentation](https://git-cliff.org/)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Homebrew Cask Documentation](https://docs.brew.sh/Cask-Cookbook)
