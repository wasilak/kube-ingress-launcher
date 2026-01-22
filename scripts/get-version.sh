#!/bin/bash
# scripts/get-version.sh
# 
# Extracts the version number from Cargo.toml
# 
# Usage: ./scripts/get-version.sh
# Output: Version string (e.g., "0.1.0")

set -e  # Exit on error
set -u  # Exit on undefined variable

# Path to Cargo.toml (relative to script location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CARGO_TOML="$PROJECT_ROOT/src-tauri/Cargo.toml"

# Validate Cargo.toml exists
if [ ! -f "$CARGO_TOML" ]; then
    echo "Error: Cargo.toml not found at: $CARGO_TOML" >&2
    exit 1
fi

# Extract version using grep and sed
# Looks for: version = "X.Y.Z"
# Extracts: X.Y.Z
VERSION=$(grep '^version = ' "$CARGO_TOML" | head -n 1 | sed 's/version = "\(.*\)"/\1/')

# Validate version was extracted
if [ -z "$VERSION" ]; then
    echo "Error: Could not extract version from Cargo.toml" >&2
    exit 1
fi

# Validate version format (basic semantic versioning check)
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$ ]]; then
    echo "Warning: Version does not follow semantic versioning format: $VERSION" >&2
fi

# Output version (no newline, for easy capture in scripts)
echo -n "$VERSION"
