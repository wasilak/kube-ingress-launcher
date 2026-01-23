# Accessibility Permission in Development

## The Problem

When developing the app, you may notice that **accessibility permission gets unchecked automatically** every time you rebuild the app. This is **expected macOS behavior**, not a bug in the application.

## Why This Happens

macOS uses code signatures to identify applications for security permissions like accessibility. When you rebuild an unsigned app in development:

1. The app binary changes
2. The code signature changes (or remains absent)
3. macOS treats it as a "different" app
4. macOS revokes the accessibility permission for security

This is a security feature to prevent malicious apps from maintaining permissions after being modified.

## Solutions

### Option 1: Manual Re-Grant (Simplest)

After each rebuild, manually re-grant permission:

1. Open **System Settings** → **Privacy & Security** → **Accessibility**
2. Find "Kube Ingress Launcher" in the list
3. Check the checkbox to grant permission
4. The global shortcut (Cmd+Shift+K) will work again

### Option 2: Use Helper Script (Faster)

Run the provided script after rebuilding:

```bash
./scripts/grant-accessibility-dev.sh
```

This script uses `sudo` to directly modify the TCC (Transparency, Consent, and Control) database to grant permission.

**Note**: This requires administrator access and modifies system files. Use with caution.

### Option 3: Ad-hoc Signing (Consistent Signature)

Sign the development build with an ad-hoc signature:

```bash
# After building
codesign -s - -f --deep "src-tauri/target/debug/bundle/macos/Kube Ingress Launcher.app"
```

This gives the app a consistent signature across rebuilds, but you'll still need to grant permission once.

### Option 4: Apple Developer Certificate (Production)

For production builds, sign with an Apple Developer certificate:

1. Get an Apple Developer account ($99/year)
2. Create a Developer ID Application certificate
3. Update `tauri.conf.json`:

```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)"
    }
  }
}
```

Properly signed apps maintain permissions across updates.

## In Production

Production builds created by the GitHub Actions workflow are properly signed (when configured), so end users won't experience this issue. The permission will persist across app updates.

## Why Not Fix This in Code?

This is not something that can be "fixed" in the application code. It's a macOS security feature that applies to all apps requesting accessibility permission. The only solution is proper code signing.

## Related Issues

- [Tauri Issue #2258](https://github.com/tauri-apps/tauri/issues/2258) - Activation policy discussion
- [Stack Overflow](https://stackoverflow.com/questions/20151177/) - AXIsProcessTrusted permission reset

## Summary

**For Development**: Accept that permission needs to be re-granted after each rebuild, or use the helper script.

**For Production**: Use proper code signing with an Apple Developer certificate.

This is standard behavior for macOS apps that require accessibility permission during development.
