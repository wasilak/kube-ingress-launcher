# macOS Gatekeeper Bypass Guide

This guide explains how to bypass macOS Gatekeeper security warnings when installing Kube Ingress Launcher, an unsigned application.

## Why This Is Necessary

Kube Ingress Launcher is distributed **unsigned** (without an Apple Developer certificate). This means:

- ✅ **Free distribution** - No $99/year Apple Developer Program fee
- ✅ **Open source** - Anyone can build and verify the code
- ⚠️ **Gatekeeper warning** - macOS will block the app by default
- ⚠️ **Manual bypass required** - You must explicitly allow the app to run

## Security Implications

**What you should know**:

1. **Unsigned ≠ Unsafe**: The application is open source and can be audited
2. **You're trusting the source**: Download only from official GitHub releases
3. **Verify checksums**: Always verify SHA256 checksums before installing
4. **Review the code**: The source code is available for inspection

**What macOS Gatekeeper protects against**:
- Malware from unknown sources
- Tampered applications
- Applications without developer accountability

**By bypassing Gatekeeper, you're**:
- Taking responsibility for trusting this application
- Accepting that macOS cannot verify the developer's identity
- Acknowledging that you've verified the source yourself

## Step-by-Step Bypass Process

### Method 1: System Settings (Recommended)

This is the official Apple-recommended method for opening unsigned applications.

#### Step 1: Initial Launch Attempt

1. Open **Finder**
2. Navigate to **Applications**
3. Find **Kube Ingress Launcher**
4. Double-click to open

You'll see this warning:

```
"Kube Ingress Launcher" cannot be opened because it is from an unidentified developer.

Your security preferences allow installation of only apps from the App Store and identified developers.
```

5. Click **OK** to dismiss

#### Step 2: Open System Settings

1. Click the **Apple menu** () in the top-left corner
2. Select **System Settings** (or **System Preferences** on older macOS)
3. Click **Privacy & Security**
4. Scroll down to the **Security** section

#### Step 3: Allow the Application

You'll see a message:

```
"Kube Ingress Launcher" was blocked from use because it is not from an identified developer.
```

1. Click **Open Anyway**
2. You'll see a confirmation dialog:
   ```
   macOS cannot verify the developer of "Kube Ingress Launcher". Are you sure you want to open it?
   ```
3. Click **Open**

#### Step 4: Grant Permissions

After the first successful launch:

1. The app will request **Accessibility** permission (for global keyboard shortcut)
2. Click **Open System Settings**
3. Enable the toggle for **Kube Ingress Launcher**
4. Restart the application

**You're done!** The application will now launch normally.

### Method 2: Right-Click Method (Quick)

This method is faster but may not work on all macOS versions.

1. Open **Finder** → **Applications**
2. **Right-click** (or Control-click) on **Kube Ingress Launcher**
3. Select **Open** from the context menu
4. Click **Open** in the confirmation dialog

This bypasses Gatekeeper for this specific launch.

### Method 3: Command Line (Advanced)

For advanced users comfortable with Terminal:

```bash
# Remove quarantine attribute
xattr -cr /Applications/Kube\ Ingress\ Launcher.app

# Verify the attribute is removed
xattr -l /Applications/Kube\ Ingress\ Launcher.app
```

This removes the quarantine flag that triggers Gatekeeper.

**Warning**: Only use this method if you trust the source and have verified the checksum.

## Verifying the Download

Before bypassing Gatekeeper, verify the DMG file is authentic:

### Step 1: Download Checksum File

```bash
# For Apple Silicon (M1/M2/M3)
curl -LO https://github.com/wasilak/kube-ingress-launcher/releases/download/vX.Y.Z/checksums-aarch64-apple-darwin.txt

# For Intel
curl -LO https://github.com/wasilak/kube-ingress-launcher/releases/download/vX.Y.Z/checksums-x86_64-apple-darwin.txt
```

### Step 2: Verify Checksum

```bash
# Verify the DMG matches the published checksum
shasum -a 256 -c checksums-aarch64-apple-darwin.txt
```

Expected output:
```
kube-ingress-launcher-X.Y.Z-aarch64-apple-darwin.dmg: OK
```

If the checksum doesn't match, **DO NOT install** - the file may be corrupted or tampered with.

## Troubleshooting

### "Open Anyway" Button Not Visible

**Symptom**: The "Open Anyway" button doesn't appear in System Settings

**Solutions**:
1. Try launching the app again - the button appears only after a blocked launch attempt
2. Wait a few seconds and refresh System Settings
3. Try the right-click method instead
4. Use the command-line method (advanced users)

### Application Still Won't Open

**Symptom**: Even after clicking "Open Anyway", the app doesn't launch

**Solutions**:
1. Check Console.app for error messages
2. Verify the app bundle is complete: `ls -la /Applications/Kube\ Ingress\ Launcher.app`
3. Try removing and reinstalling
4. Check if you have sufficient permissions
5. Try the command-line method to remove quarantine

### Accessibility Permission Not Working

**Symptom**: Global keyboard shortcut doesn't work after granting permission

**Solutions**:
1. Restart the application after granting permission
2. Verify the permission is enabled in System Settings
3. Try toggling the permission off and on again
4. Restart your Mac if the issue persists

### "Damaged" Application Warning

**Symptom**: macOS says the application is "damaged and can't be opened"

**Solutions**:
1. This usually means the quarantine attribute is causing issues
2. Use the command-line method: `xattr -cr /Applications/Kube\ Ingress\ Launcher.app`
3. If that doesn't work, re-download the DMG
4. Verify the checksum to ensure the download wasn't corrupted

### Gatekeeper Keeps Blocking After Bypass

**Symptom**: Every launch triggers Gatekeeper warning

**Solutions**:
1. The bypass may not have been saved properly
2. Try the command-line method to permanently remove quarantine
3. Check if you have admin privileges
4. Verify System Integrity Protection (SIP) is not interfering

## Alternative Installation Methods

If you're uncomfortable bypassing Gatekeeper:

### Option 1: Build from Source

Build the application yourself from source code:

```bash
git clone https://github.com/wasilak/kube-ingress-launcher.git
cd kube-ingress-launcher
npm install
npm run tauri build
```

This way, you can audit the code before building.

### Option 2: Wait for Signed Version

Future versions may be code-signed with an Apple Developer certificate. Watch the repository for announcements.

## Understanding macOS Security

### What is Gatekeeper?

Gatekeeper is a macOS security feature that:
- Verifies applications are from identified developers
- Checks for known malware
- Ensures applications haven't been tampered with
- Protects users from accidentally running malicious software

### What is Code Signing?

Code signing is a process where:
- Developers sign applications with an Apple-issued certificate
- macOS verifies the signature before running the app
- Users can trust the developer's identity
- Requires Apple Developer Program membership ($99/year)

### Why Not Sign This Application?

Reasons for distributing unsigned:
1. **Cost**: Apple Developer Program costs $99/year
2. **Open Source**: Anyone can build and verify the code
3. **Transparency**: No hidden processes or proprietary signing
4. **Community**: Allows community contributions without barriers

## FAQ

### Is it safe to bypass Gatekeeper?

**It depends on the source**. For Kube Ingress Launcher:
- ✅ Source code is open and auditable
- ✅ Downloads from official GitHub releases
- ✅ Checksums provided for verification
- ✅ Community can review and report issues

Always verify checksums and download only from official sources.

### Will this affect other applications?

**No**. Bypassing Gatekeeper for one application doesn't affect others. Each application must be individually allowed.

### Can I re-enable Gatekeeper protection?

**Yes**. Gatekeeper remains active for all other applications. You've only allowed this specific application.

### Do I need to do this every time I update?

**It depends**:
- **Homebrew updates**: Usually no, Homebrew handles this
- **Manual DMG updates**: Yes, you'll need to bypass again for each new version
- **Built from source**: No, locally built apps don't trigger Gatekeeper

### What if I don't trust this application?

**Don't install it**. If you're uncomfortable:
1. Review the source code on GitHub
2. Build from source yourself
3. Wait for a signed version
4. Use alternative tools

Your security is your responsibility.

## Additional Resources

- [Apple Support: Open apps safely on Mac](https://support.apple.com/en-us/HT202491)
- [Apple Developer: Code Signing](https://developer.apple.com/support/code-signing/)
- [macOS Security Guide](https://support.apple.com/guide/security/welcome/web)

## Reporting Security Issues

If you discover a security issue with Kube Ingress Launcher:

1. **Do not** open a public GitHub issue
2. Email the maintainers directly (see README.md)
3. Provide details about the vulnerability
4. Allow time for a fix before public disclosure

## Conclusion

Bypassing Gatekeeper is a manual process that requires your explicit consent. By following this guide, you're making an informed decision to trust this application.

**Remember**:
- ✅ Verify checksums before installing
- ✅ Download only from official sources
- ✅ Review the code if you're concerned
- ✅ Report any security issues responsibly

Stay safe and enjoy using Kube Ingress Launcher!
