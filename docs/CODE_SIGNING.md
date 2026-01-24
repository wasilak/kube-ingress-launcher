# Code Signing for macOS

## The Problem

Accessibility permission resets after each app update when using ad-hoc signing. This is because:

1. **Ad-hoc signing** (`codesign -s -`) creates a signature based on binary content
2. Every build changes the binary, so the signature changes
3. macOS TCC database caches the code signature requirement (`csreq`)
4. When signature doesn't match, accessibility permission is revoked

## The Solution: Apple Developer Certificate

To maintain accessibility permission across updates, you need to sign with an **Apple Developer Certificate** (Developer ID Application).

### Benefits of Proper Signing

✅ Consistent app identity across all builds  
✅ Accessibility permission persists through updates  
✅ Users don't need to re-grant permission after each update  
✅ App can be notarized for Gatekeeper  
✅ Professional distribution  

### Current Status

The app currently uses **ad-hoc signing** which means:
- ⚠️  Accessibility permission resets after each Homebrew update
- ⚠️  Users must uncheck/recheck permission after updates
- ⚠️  Not suitable for production distribution

## Setting Up Proper Code Signing

### 1. Get an Apple Developer Certificate

1. Enroll in [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
2. Create a **Developer ID Application** certificate in your Apple Developer account
3. Download and install the certificate on your Mac
4. Export the certificate as a `.p12` file with a password

### 2. Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```
APPLE_CERTIFICATE_BASE64
APPLE_CERTIFICATE_PASSWORD
APPLE_SIGNING_IDENTITY
```

#### Generate APPLE_CERTIFICATE_BASE64

```bash
# Export your certificate as .p12 from Keychain Access
# Then convert to base64:
base64 -i YourCertificate.p12 | pbcopy
# Paste into GitHub secret
```

#### Set APPLE_CERTIFICATE_PASSWORD

The password you used when exporting the `.p12` file.

#### Set APPLE_SIGNING_IDENTITY

Your Developer ID, typically: `Developer ID Application: Your Name (TEAM_ID)`

Find it with:
```bash
security find-identity -v -p codesigning
```

### 3. Update Workflow

The workflow is already prepared to use proper signing when secrets are configured. It will:

1. Import the certificate from secrets
2. Sign with your Developer ID
3. Verify the signature
4. Create the DMG with properly signed app

### 4. Update tauri.conf.json

```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)"
    }
  }
}
```

## Notarization (Optional but Recommended)

For the best user experience, also notarize your app:

1. Add these secrets:
   - `APPLE_ID` - Your Apple ID email
   - `APPLE_ID_PASSWORD` - App-specific password
   - `APPLE_TEAM_ID` - Your team ID

2. Workflow will automatically notarize after signing

## Verification

After setting up proper signing, verify it works:

```bash
# Check signature
codesign -dv --verbose=4 /Applications/Kube\ Ingress\ Launcher.app

# Should show:
# Authority=Developer ID Application: Your Name (TEAM_ID)
# Signed Time=...
```

## For Development

Local development still uses ad-hoc signing via `just dev-run`. This is fine for development because:

- You only grant permission once during development
- You can uncheck/recheck when needed
- No need to use your production certificate for dev builds

## Cost-Benefit Analysis

### With Apple Developer Certificate ($99/year)
- ✅ Professional distribution
- ✅ Permission persists across updates
- ✅ Better user experience
- ✅ Can notarize for Gatekeeper
- ✅ Required for Mac App Store

### Without Certificate (Current)
- ⚠️  Users must re-grant permission after each update
- ⚠️  Not suitable for wide distribution
- ⚠️  Cannot notarize
- ✅ Free
- ✅ Fine for personal use

## References

- [Apple Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [Tauri Code Signing](https://tauri.app/v1/guides/distribution/sign-macos/)
- [TCC Database and csreq](https://stackoverflow.com/questions/29078325/)

## Summary

**Current**: Ad-hoc signing (free, but permission resets on updates)  
**Recommended**: Apple Developer certificate ($99/year, permission persists)  
**Decision**: Up to you based on distribution needs
