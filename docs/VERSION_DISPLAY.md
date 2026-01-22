# Version Display Feature

## Overview

The Settings dialog now displays comprehensive version information including the application version, git branch (when running locally), git commit hash, and build profile.

## Implementation

### Backend (Rust)

**File**: `src-tauri/src/commands/settings.rs`

Added `get_version_info` Tauri command that:
- Extracts version from `CARGO_PKG_VERSION` environment variable (set from Cargo.toml)
- Attempts to get current git branch using `git rev-parse --abbrev-ref HEAD`
- Attempts to get current git commit hash using `git rev-parse --short HEAD`
- Determines build profile (debug or release) using `cfg!(debug_assertions)`

**Command Registration**: `src-tauri/src/lib.rs`
- Added `commands::settings::get_version_info` to the invoke handler

### Frontend (TypeScript/React)

**Type Definition**: `src/types/ingress.ts`

Added `VersionInfo` interface:
```typescript
export interface VersionInfo {
  version: string;
  gitBranch: string | null;
  gitCommit: string | null;
  buildProfile: string;
}
```

**Component**: `src/components/SettingsDialog.tsx`

Added version display section at the bottom of the Settings dialog:
- Version badge (always shown)
- Git branch badge (shown when available, blue color)
- Git commit badge (shown when available, monospace font)
- Build profile badge (green for release, orange for debug)

## User Experience

### Release Builds
When running a release build (e.g., from Homebrew):
- Shows version number (e.g., "0.1.0")
- Shows build profile as "release" (green badge)
- Git information not available (commands fail in production)

### Development Builds
When running locally with `npm run tauri dev`:
- Shows version number from Cargo.toml
- Shows current git branch (e.g., "main", "feature/xyz")
- Shows current git commit hash (short form, e.g., "a1b2c3d")
- Shows build profile as "debug" (orange badge)

## Version Source of Truth

The version is defined in `src-tauri/Cargo.toml`:
```toml
[package]
version = "0.1.0"
```

This is the single source of truth for the application version. When creating releases:
1. Update version in `src-tauri/Cargo.toml`
2. Create git tag: `git tag v0.1.0`
3. Push tag: `git push origin v0.1.0`
4. GitHub Actions will build and create release

## Benefits

1. **Transparency**: Users can see exactly what version they're running
2. **Debugging**: Git branch and commit help identify exact code state
3. **Development**: Easy to distinguish between debug and release builds
4. **Support**: Users can provide version info when reporting issues

## Testing

To test locally:
```bash
npm run tauri dev
```

Then:
1. Click the menu bar icon
2. Select "Options"
3. Scroll to the bottom of the Settings dialog
4. Verify version information is displayed correctly

## Future Enhancements

Possible improvements:
- Add "Copy version info" button for easy sharing
- Include build timestamp
- Show update availability (if implementing auto-update)
- Display Tauri version and other dependencies
