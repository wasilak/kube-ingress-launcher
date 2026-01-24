# Code Signing for macOS

## Quick Answer

**Yes!** You can provide CI with a consistent signature by using an Apple Developer certificate. This requires:

1. **Apple Developer Program** membership ($99/year)
2. **Export your certificate** as a `.p12` file
3. **Add 3 GitHub secrets** with the certificate and signing identity
4. **Done!** - Next release will use the same signature forever

All Homebrew users will get the same signature, and accessibility permission will persist across updates.

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

### 3. Workflow is Ready

The GitHub Actions workflow (`.github/workflows/release.yml`) is already configured to use proper signing when secrets are available. It will automatically:

1. Import the certificate from `APPLE_CERTIFICATE_BASE64` secret
2. Create a temporary keychain for signing
3. Sign with your Developer ID from `APPLE_SIGNING_IDENTITY`
4. Verify the signature
5. Create the DMG with properly signed app
6. Clean up the temporary keychain

**No workflow changes needed** - just add the secrets and the next release will use proper signing!

### 4. Verify Setup (Optional)

After adding the secrets, you can verify they're configured correctly:

1. Go to your repository Settings → Secrets and variables → Actions
2. You should see:
   - `APPLE_CERTIFICATE_BASE64` (set)
   - `APPLE_CERTIFICATE_PASSWORD` (set)
   - `APPLE_SIGNING_IDENTITY` (set)

The next release will automatically use these for signing.

### 5. Update tauri.conf.json (Optional)

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

## What Happens After Setup

Once you configure the GitHub secrets with your Apple Developer certificate:

### ✅ Consistent Signature Across All Releases
- Every build from CI will have the **same signature**
- macOS will recognize all versions as the same app
- Accessibility permission will **persist across updates**
- Users install once, grant permission once, done!

### 🔄 Update Flow for Users
1. User installs v1.0.0 via Homebrew
2. User grants accessibility permission (one time)
3. v1.1.0 is released with same certificate
4. User runs `brew upgrade kube-ingress-launcher`
5. ✅ Permission still works - no action needed!

### 🆚 Comparison

| Aspect | Ad-hoc Signing (Current) | Apple Developer Certificate |
|--------|-------------------------|----------------------------|
| Cost | Free | $99/year |
| Signature | Changes every build | Same across all builds |
| Permission persistence | ❌ Resets on update | ✅ Persists across updates |
| User experience | Must re-grant after each update | Grant once, works forever |
| Notarization | ❌ Not possible | ✅ Possible |
| Distribution | Personal use | Professional distribution |

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
