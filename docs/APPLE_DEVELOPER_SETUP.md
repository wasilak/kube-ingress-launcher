# Apple Developer Certificate Setup Guide

## Quick Steps

To enable consistent code signatures across all Homebrew releases:

### 1. Get Apple Developer Certificate

1. Enroll in [Apple Developer Program](https://developer.apple.com/programs/) - $99/year
2. Go to [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/certificates/list)
3. Click **+** to create a new certificate
4. Select **Developer ID Application** (for distribution outside Mac App Store)
5. Follow the instructions to create a Certificate Signing Request (CSR)
6. Download the certificate and double-click to install in Keychain Access

### 2. Export Certificate

1. Open **Keychain Access** app
2. Select **login** keychain and **My Certificates** category
3. Find your **Developer ID Application** certificate
4. Right-click → **Export "Developer ID Application: Your Name"**
5. Save as `.p12` file
6. Set a strong password (you'll need this for GitHub secrets)

### 3. Prepare for GitHub Secrets

#### Get Certificate Base64

```bash
# Convert .p12 to base64
base64 -i YourCertificate.p12 | pbcopy
# Now paste into GitHub secret
```

#### Get Signing Identity

```bash
# Find your signing identity
security find-identity -v -p codesigning

# Look for line like:
# 1) ABC123... "Developer ID Application: Your Name (TEAM_ID)"
# Copy the full string in quotes
```

### 4. Add GitHub Secrets

1. Go to your repository on GitHub
2. Settings → Secrets and variables → Actions
3. Click **New repository secret** for each:

| Secret Name | Value | Example |
|------------|-------|---------|
| `APPLE_CERTIFICATE_BASE64` | Base64-encoded .p12 file | `MIIKvgIBAzCCCn...` |
| `APPLE_CERTIFICATE_PASSWORD` | Password you set when exporting | `your-secure-password` |
| `APPLE_SIGNING_IDENTITY` | Full identity string from keychain | `Developer ID Application: John Doe (ABC123XYZ)` |

### 5. Test It

1. Create a new tag: `git tag v0.1.1 && git push origin v0.1.1`
2. Watch the GitHub Actions workflow run
3. Check the "Sign app bundle" step - should say "Using Apple Developer certificate"
4. Download the DMG and verify signature:

```bash
# Mount the DMG and check signature
codesign -dv --verbose=4 /Volumes/*/Kube\ Ingress\ Launcher.app

# Should show:
# Authority=Developer ID Application: Your Name (TEAM_ID)
# Signed Time=...
```

## What This Fixes

### Before (Ad-hoc Signing)
- ❌ Each build has different signature
- ❌ Accessibility permission resets on every Homebrew update
- ❌ Users must uncheck/recheck permission after each update

### After (Apple Developer Certificate)
- ✅ All builds have the same signature
- ✅ Accessibility permission persists across updates
- ✅ Users grant permission once, works forever
- ✅ Professional distribution ready
- ✅ Can be notarized for Gatekeeper

## Troubleshooting

### Certificate not found during signing

Check that all three secrets are set correctly:
```bash
# In GitHub Actions logs, look for:
# "Available signing identities:"
# Should list your Developer ID
```

### Wrong password error

The `APPLE_CERTIFICATE_PASSWORD` must match the password you used when exporting the `.p12` file.

### Identity string doesn't match

Make sure `APPLE_SIGNING_IDENTITY` exactly matches the output from:
```bash
security find-identity -v -p codesigning
```

Include the full string in quotes, like: `Developer ID Application: Your Name (TEAM_ID)`

## Cost

- **Apple Developer Program**: $99/year
- **GitHub Actions**: Free for public repositories
- **Total**: $99/year for consistent signatures

## Alternative: Stay with Ad-hoc Signing

If you don't want to pay $99/year, you can continue with ad-hoc signing:

- ✅ Free
- ✅ Works for personal use
- ❌ Users must re-grant permission after each update
- ❌ Not suitable for wide distribution

The workflow will automatically use ad-hoc signing if no certificate is configured.

## References

- [Apple Developer Program](https://developer.apple.com/programs/)
- [Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [Tauri Code Signing](https://tauri.app/v1/guides/distribution/sign-macos/)
- [Full Documentation](./CODE_SIGNING.md)
