# Homebrew Tap for Kube Ingress Launcher

This is the Homebrew tap repository for [Kube Ingress Launcher](https://github.com/wasilak/kube-ingress-launcher), a desktop application for quickly searching and opening Kubernetes ingress resources.

## Installation

```bash
# Add the tap
brew tap wasilak/kube-ingress-launcher

# Install the application
brew install --cask kube-ingress-launcher
```

## Updating

```bash
brew upgrade --cask kube-ingress-launcher
```

## Uninstalling

```bash
# Uninstall the application
brew uninstall --cask kube-ingress-launcher

# Remove all application data (optional)
brew uninstall --zap --cask kube-ingress-launcher
```

## About Unsigned Applications

Kube Ingress Launcher is distributed unsigned (without an Apple Developer certificate). After installation, you'll need to bypass macOS Gatekeeper:

1. Try to open the application from `/Applications`
2. Go to **System Settings** > **Privacy & Security**
3. Click **"Open Anyway"** in the Security section
4. Confirm by clicking **"Open"**

For detailed instructions, see the [Gatekeeper Bypass Guide](https://github.com/wasilak/kube-ingress-launcher/blob/main/docs/GATEKEEPER_BYPASS.md).

## Troubleshooting

### Application Won't Open

If the application won't open after bypassing Gatekeeper:

```bash
# Remove quarantine attribute
xattr -cr /Applications/Kube\ Ingress\ Launcher.app
```

### Reinstalling

If you need to reinstall:

```bash
brew reinstall --cask kube-ingress-launcher
```

### Verifying Installation

```bash
# Check if installed
brew list --cask kube-ingress-launcher

# Check installation location
ls -la /Applications/Kube\ Ingress\ Launcher.app
```

## Supported Architectures

- **Apple Silicon** (M1/M2/M3): `aarch64-apple-darwin`
- **Intel**: `x86_64-apple-darwin`

The Cask formula automatically detects your architecture and installs the correct version.

## Requirements

- macOS 10.13 (High Sierra) or later
- Kubernetes cluster with kubeconfig at `~/.kube/config`

## Features

- **Spotlight-like Interface**: Frameless window with macOS vibrancy effects
- **Global Keyboard Shortcut**: Quick access with Cmd+Shift+K
- **Menu Bar Application**: Runs in the menu bar without a dock icon
- **Kubernetes Integration**: Connects using your existing kubeconfig
- **Background Refresh**: Automatically updates ingress data
- **Fast Search**: Instant filtering by name, namespace, host, or URL

## Links

- **Main Repository**: https://github.com/wasilak/kube-ingress-launcher
- **Issues**: https://github.com/wasilak/kube-ingress-launcher/issues
- **Releases**: https://github.com/wasilak/kube-ingress-launcher/releases
- **Documentation**: https://github.com/wasilak/kube-ingress-launcher/blob/main/README.md

## Contributing

If you find issues with the Homebrew formula, please open an issue in this repository.

For issues with the application itself, please use the [main repository](https://github.com/wasilak/kube-ingress-launcher/issues).

## License

GPL-3.0

## Maintainer

This tap is maintained by the Kube Ingress Launcher team.
