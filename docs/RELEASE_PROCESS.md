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

1. **Builds the application** for both architectures:
   - Apple Silicon (aarch64)
   - Intel (x86_64)

2. **Creates DMG files**:
   - `kube-ingress-launcher-0.2.0-aarch64-apple-darwin.dmg`
   - `kube-ingress-launcher-0.2.0-x86_64-apple-darwin.dmg`

3. **Generates checksums**:
   - `checksums-aarch64-apple-darwin.txt`
   - `checksums-x86_64-apple-darwin.txt`

4. **Creates a GitHub Release**:
   - Release title: `v0.2.0`
   - Uploads all DMG files and checksums
   - Marks as draft (you need to publish it)

5. **You manually**:
   - Edit the release notes
   - Publish the release
   - Update Homebrew tap (if needed)

## Updating Homebrew Tap

After publishing a release, update the Homebrew tap:

```bash
./scripts/update-formula.sh 0.2.0
```

This will:
1. Download checksums from the GitHub release
2. Update the Cask formula with new version and checksums
3. Commit and push to the tap repository

See [HOMEBREW_TAP_SETUP.md](HOMEBREW_TAP_SETUP.md) for details.

## Release Checklist

Before creating a release:

- [ ] All tests pass: `npm test && cargo test --manifest-path src-tauri/Cargo.toml`
- [ ] Application builds: `npm run tauri build`
- [ ] Application runs correctly: `npm run tauri dev`
- [ ] Version follows semantic versioning
- [ ] CHANGELOG updated (if you maintain one)
- [ ] Documentation updated for new features
- [ ] No uncommitted changes

After pushing the tag:

- [ ] Wait for GitHub Actions to complete
- [ ] Verify DMG files are created
- [ ] Download and test DMG files on both architectures (if possible)
- [ ] Edit release notes on GitHub
- [ ] Publish the GitHub release
- [ ] Update Homebrew tap
- [ ] Test Homebrew installation: `brew upgrade --cask kube-ingress-launcher`
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

## Resources

- [Semantic Versioning](https://semver.org/)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Homebrew Cask Documentation](https://docs.brew.sh/Cask-Cookbook)
