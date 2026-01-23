# Accessibility Permission in Development

## The Problem

The app shows "Accessibility permission check failed" even though the checkbox is checked in System Settings → Privacy & Security → Accessibility.

## Why This Happens

macOS stores a **code signature requirement blob** (`csreq`) in the TCC (Transparency, Consent, and Control) database when you grant accessibility permission. This is a fingerprint of your app's exact code signature.

When you rebuild the app:
1. The code signature changes (even with ad-hoc signing)
2. The TCC database still has the OLD signature cached
3. `AXIsProcessTrusted()` returns false because signatures don't match
4. The checkbox stays checked, but the permission doesn't actually work

This is documented behavior: [Stack Overflow #29078325](https://stackoverflow.com/questions/29078325/)

## The Solution

**Uncheck and recheck the permission** after each rebuild:

1. Open **System Settings** → **Privacy & Security** → **Accessibility**
2. Find "Kube Ingress Launcher" in the list
3. **Uncheck** the box
4. **Check** it again immediately
5. Done! The cached signature is refreshed

This clears the cached `csreq` blob and stores the new signature.

## Development Workflow

```bash
# Build and sign
just dev-run

# First time or after rebuild:
# 1. App shows permission warning
# 2. Go to System Settings → Accessibility
# 3. Uncheck "Kube Ingress Launcher"
# 4. Check it again
# 5. Click "Recheck" in the app
# 6. Warning disappears!
```

## Why Ad-hoc Signing Doesn't Fully Solve This

Ad-hoc signing (`codesign -s -`) creates a signature based on the binary content. Every rebuild changes the binary, so the signature changes. The TCC database caches the old signature, causing the mismatch.

**Only a real Apple Developer certificate** provides a truly consistent identity across rebuilds.

## Alternative: Remove and Re-add

Instead of unchecking/rechecking, you can:
1. Remove "Kube Ingress Launcher" from the Accessibility list (click `-`)
2. Click `+` and add it back
3. This also clears the cached signature

But unchecking/rechecking is faster.

## For Production

Production builds signed with an Apple Developer certificate maintain a consistent identity. Users won't experience this issue - permission persists across updates.

## Technical Details

The TCC database is at `/Library/Application Support/com.apple.TCC/TCC.db` and contains:

```sql
SELECT client, auth_value, csreq FROM access WHERE service = 'kTCCServiceAccessibility';
```

The `csreq` column contains a binary blob representing the code signature requirement. When this doesn't match the running app's signature, `AXIsProcessTrusted()` returns false.

## Summary

**For Development**: After each rebuild, uncheck and recheck the permission in System Settings.

**For Production**: Use proper code signing with an Apple Developer certificate.

This is standard macOS behavior for all apps requiring accessibility permission during development.
