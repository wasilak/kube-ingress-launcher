# Task Automation with `just`

This project uses [`just`](https://github.com/casey/just) for task automation. It's like `make` but better - simpler syntax, cross-platform, and written in Rust.

## Installation

### macOS
```bash
brew install just
```

### Linux
```bash
# Arch
pacman -S just

# Ubuntu/Debian
wget -qO - 'https://proget.makedeb.org/debian-feeds/prebuilt-mpr.pub' | gpg --dearmor | sudo tee /usr/share/keyrings/prebuilt-mpr-archive-keyring.gpg 1> /dev/null
echo "deb [arch=all,$(dpkg --print-architecture) signed-by=/usr/share/keyrings/prebuilt-mpr-archive-keyring.gpg] https://proget.makedeb.org prebuilt-mpr $(lsb_release -cs)" | sudo tee /etc/apt/sources.list.d/prebuilt-mpr.list
sudo apt update
sudo apt install just
```

### Other platforms
See [installation guide](https://github.com/casey/just#installation)

## Usage

### List all available commands
```bash
just
# or
just --list
```

### Common workflows

#### Development
```bash
# Build and sign for development (most used!)
just dev

# This replaces:
#   npm run tauri dev
#   ./scripts/dev-sign.sh
```

#### Building
```bash
# Build universal binary for production
just build

# Build and sign for local testing
just build-signed

# Create DMG
just dmg
```

#### Testing
```bash
# Run all tests
just test

# Run only frontend tests
just test-frontend

# Run only backend tests
just test-backend
```

#### Code quality
```bash
# Lint all code
just lint

# Format all code
just fmt

# Run all checks (lint + test + build)
just check
```

#### Cleaning
```bash
# Clean build artifacts
just clean

# Deep clean (including node_modules)
just clean-all
```

#### Version management
```bash
# Show current version
just version

# Bump to specific version
just bump 0.2.0

# Quick patch release (0.1.0 -> 0.1.1)
just release-patch

# Quick minor release (0.1.0 -> 0.2.0)
just release-minor
```

#### Utilities
```bash
# Install dependencies
just deps

# Grant accessibility permission
just grant-permission

# Open app in Finder
just open

# Show app info
just info
```

## GitHub Actions Integration

The `justfile` works seamlessly with GitHub Actions:

```yaml
- name: Setup just
  uses: extractions/setup-just@v2

- name: Run checks
  run: just check

- name: Build
  run: just build
```

## Why `just` over `make`?

1. **No tab sensitivity** - Uses spaces, not tabs
2. **Better error messages** - Clear, helpful errors
3. **Cross-platform** - Works on macOS, Linux, Windows
4. **Modern syntax** - Easier to read and write
5. **Rust-based** - Fits our tech stack
6. **Active development** - Well-maintained

## Tips

### Run multiple recipes
```bash
just clean deps build
```

### Pass arguments
```bash
just bump 1.0.0
```

### Dry run (show what would be executed)
```bash
just --dry-run dev
```

### Run from subdirectory
```bash
cd src-tauri
just test-backend  # Still works!
```

## Common Workflows

### Daily development
```bash
just dev  # Build and sign
# Make changes
just dev  # Rebuild and sign
```

### Before committing
```bash
just check  # Lint, test, and build
```

### Creating a release
```bash
just release-patch  # Bump version and create tag
git ptf             # Push with tags
# GitHub Actions handles the rest
```

### Clean slate
```bash
just clean-all  # Remove everything
just deps       # Reinstall dependencies
just dev        # Build fresh
```

## Extending the justfile

The `justfile` is easy to extend. Add new recipes as needed:

```justfile
# Example: Run app with specific flags
run-debug:
    @echo "🚀 Running with debug flags..."
    ./src-tauri/target/debug/bundle/macos/Kube\ Ingress\ Launcher.app/Contents/MacOS/kube-ingress-launcher --debug
```

See the [just documentation](https://just.systems/man/en/) for more features.
