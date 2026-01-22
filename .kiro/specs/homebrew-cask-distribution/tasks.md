# Implementation Tasks

## Phase 1: Tauri Configuration and Local Build Setup

### Task 1.1: Update Tauri Bundle Configuration
- [x] Update `src-tauri/tauri.conf.json` with correct bundle identifier `foo.otteryak.kube-ingress-desktop`
- [x] Verify bundle configuration includes proper metadata (name, description, category)
- [x] Ensure minimum macOS version is set to 10.13
- [x] Confirm signing identity is set to null for unsigned distribution
- [~] Test local build with `npm run tauri build`

### Task 1.2: Create DMG Build Script
- [~] Create `scripts/create-dmg.sh` script for DMG generation
- [~] Implement logic to copy .app bundle to temporary directory
- [~] Add hdiutil command to create compressed DMG (UDZO format, compression level 9)
- [~] Implement proper naming convention: `kube-ingress-launcher-{version}-{arch}.dmg`
- [~] Add cleanup logic to remove temporary files
- [~] Make script executable: `chmod +x scripts/create-dmg.sh`
- [~] Test script locally with both architectures

### Task 1.3: Create Version Extraction Script
- [~] Create `scripts/get-version.sh` to extract version from Cargo.toml
- [~] Implement grep/sed logic to parse version field
- [~] Test script returns correct version format
- [~] Make script executable: `chmod +x scripts/get-version.sh`

## Phase 2: GitHub Actions CI/CD Pipeline

### Task 2.1: Create Release Workflow File
- [~] Create `.github/workflows/release.yml`
- [~] Configure workflow to trigger on version tags (pattern: `v*`)
- [~] Set up matrix strategy for both architectures (x86_64-apple-darwin, aarch64-apple-darwin)
- [~] Use `macos-latest` runner

### Task 2.2: Implement Build Job Steps
- [~] Add checkout step using `actions/checkout@v4`
- [~] Add Rust setup using `dtolnay/rust-toolchain@stable` with target matrix
- [~] Add Node.js setup using `actions/setup-node@v4` with version 18 and npm cache
- [~] Add npm dependencies installation step: `npm ci`
- [~] Add Tauri build step with target flag: `npm run tauri build -- --target ${{ matrix.target }}`

### Task 2.3: Implement DMG Creation and Checksum Steps
- [~] Add step to locate built .app bundle from Tauri output
- [~] Add step to run DMG creation script with proper parameters
- [~] Add step to calculate SHA256 checksums: `shasum -a 256 *.dmg > checksums-${{ matrix.target }}.txt`
- [~] Add step to verify DMG files were created successfully

### Task 2.4: Implement Release Upload
- [~] Add release upload step using `softprops/action-gh-release@v1`
- [~] Configure to upload DMG files and checksum files
- [~] Set GITHUB_TOKEN from secrets
- [~] Configure to create release if it doesn't exist
- [~] Add release notes generation from git log or changelog

### Task 2.5: Test CI/CD Pipeline
- [~] Create a test tag and push to trigger workflow
- [~] Verify workflow runs successfully for both architectures
- [~] Verify DMG files are created and uploaded to release
- [~] Verify checksums are correct
- [~] Delete test release after verification

## Phase 3: Homebrew Tap Repository Setup

### Task 3.1: Create Tap Repository
- [~] Create new GitHub repository: `homebrew-kube-ingress-launcher`
- [~] Initialize with README.md explaining tap purpose
- [~] Create `Casks/` directory
- [~] Add `.gitignore` for macOS and Homebrew-specific files

### Task 3.2: Create Initial Cask Formula
- [~] Create `Casks/kube-ingress-launcher.rb`
- [~] Implement version variable
- [~] Implement architecture detection (arm/intel)
- [~] Add download URL template using GitHub releases
- [~] Add placeholder SHA256 checksums (to be updated after first release)
- [~] Add app name, description, and homepage
- [~] Add `app` stanza to install .app bundle
- [~] Add `zap` stanza for complete uninstallation

### Task 3.3: Create Tap Documentation
- [~] Write README.md with installation instructions
- [~] Document how to add the tap: `brew tap wasilak/kube-ingress-launcher`
- [~] Document how to install: `brew install --cask kube-ingress-launcher`
- [~] Add section on Gatekeeper bypass for unsigned apps
- [~] Add troubleshooting section
- [~] Add update and uninstall instructions

## Phase 4: Formula Update Automation

### Task 4.1: Create Formula Update Script
- [~] Create `scripts/update-formula.sh` in main repository
- [~] Implement logic to extract version from Cargo.toml
- [~] Implement logic to download checksums from GitHub release
- [~] Implement logic to update formula file with new version and checksums
- [~] Add git commit and push logic
- [~] Make script executable: `chmod +x scripts/update-formula.sh`

### Task 4.2: Create Formula Update Workflow
- [~] Create `.github/workflows/update-tap.yml` in tap repository
- [~] Configure workflow to trigger on `repository_dispatch` event
- [~] Add checkout step for tap repository
- [~] Add step to download release information
- [~] Add step to update formula with new version and checksums
- [~] Add step to commit and push changes
- [~] Configure GitHub token with proper permissions

### Task 4.3: Integrate Tap Update into Release Workflow
- [~] Add job to main release workflow to trigger tap update
- [~] Use `repository_dispatch` to trigger tap workflow
- [~] Pass version and release information as payload
- [~] Add dependency on build-and-release job completion

## Phase 5: Testing and Validation

### Task 5.1: Manual Installation Testing
- [~] Perform clean installation on Intel Mac
- [~] Perform clean installation on Apple Silicon Mac
- [~] Verify app installs to /Applications
- [~] Verify app launches (after Gatekeeper bypass)
- [~] Test app functionality after installation
- [~] Verify uninstallation removes all files

### Task 5.2: Update Testing
- [~] Create second test release with version bump
- [~] Test `brew upgrade` detects new version
- [~] Verify upgrade process works correctly
- [~] Verify app functionality after upgrade
- [~] Verify user data/settings are preserved

### Task 5.3: Create Automated Test Workflow
- [~] Create `.github/workflows/test-install.yml`
- [~] Configure to run on release creation
- [~] Add step to install Homebrew (if not present)
- [~] Add step to add tap
- [~] Add step to install cask
- [~] Add step to verify installation
- [~] Add step to verify DMG structure
- [~] Add step to test uninstallation

## Phase 6: Documentation and Release

### Task 6.1: Update Main Repository README
- [~] Add "Installation" section with Homebrew instructions
- [~] Add instructions for adding the tap
- [~] Add instructions for installing via Homebrew Cask
- [ ] Add section on Gatekeeper bypass for unsigned apps
- [~] Add troubleshooting section for common issues
- [ ] Add update and uninstall instructions
- [~] Add badges for latest release version

### Task 6.2: Create Release Documentation
- [~] Create `RELEASING.md` with step-by-step release process
- [~] Document version bumping procedure
- [~] Document tag creation and pushing
- [~] Document verification steps
- [~] Document rollback procedures

### Task 6.3: Create User Guide for Gatekeeper Bypass
- [~] Document step-by-step Gatekeeper bypass process
- [~] Add screenshots showing security dialogs
- [~] Explain security implications of unsigned apps
- [~] Provide alternative installation methods if needed
- [~] Add FAQ section for common security questions

### Task 6.4: Perform First Official Release
- [~] Bump version in Cargo.toml to 1.0.0
- [~] Create and push version tag: `git tag v1.0.0 && git push origin v1.0.0`
- [~] Verify CI/CD pipeline runs successfully
- [~] Verify GitHub release is created with artifacts
- [~] Verify tap formula is updated automatically
- [~] Test installation from Homebrew
- [~] Announce release

## Phase 7: Monitoring and Maintenance

### Task 7.1: Set Up Release Monitoring
- [~] Configure GitHub notifications for workflow failures
- [~] Set up monitoring for tap repository issues
- [~] Create issue templates for installation problems
- [~] Document common failure scenarios and solutions

### Task 7.2: Create Maintenance Procedures
- [~] Document how to manually update formula if automation fails
- [~] Document how to fix broken releases
- [~] Document how to handle architecture-specific issues
- [~] Create runbook for common maintenance tasks

## Notes

- All scripts should include proper error handling and logging
- Test each phase thoroughly before proceeding to the next
- Keep tap repository synchronized with main repository releases
- Monitor GitHub Actions usage and optimize if needed
- Consider adding pre-release testing workflow for beta versions
