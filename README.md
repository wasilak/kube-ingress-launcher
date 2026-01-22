# Kubernetes Ingress Desktop Search

A standalone Tauri-based macOS desktop application that provides Spotlight-like search for Kubernetes ingress resources. The application runs as a menu bar utility, accessible via a global keyboard shortcut (Cmd+Shift+K), and displays ingress information in a compact, frameless window with native macOS vibrancy effects.

## Features

- **Spotlight-like Interface**: Frameless window with macOS vibrancy blur effects
- **Global Keyboard Shortcut**: Quick access with Cmd+Shift+K from any application
- **Menu Bar Application**: Runs in the menu bar without a dock icon
- **Kubernetes Integration**: Connects to clusters using your existing kubeconfig
- **Background Refresh**: Automatically updates ingress data every 60 seconds
- **Fast Search**: Instant filtering by name, namespace, host, or URL
- **URL Opening**: Click to open ingress URLs in your default browser
- **Settings Management**: Configure shortcuts, refresh intervals, and Kubernetes contexts

## Prerequisites

Before you begin, ensure you have the following installed:

- **Rust**: Version 1.70 or higher
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

- **Node.js**: Version 18 or higher
  ```bash
  # Using Homebrew
  brew install node
  ```

- **Kubernetes Configuration**: A valid kubeconfig file at `~/.kube/config`
  - The application uses your existing Kubernetes configuration
  - Ensure you have access to at least one Kubernetes cluster

## Installation

### Option 1: Install via Homebrew (Recommended)

The easiest way to install Kube Ingress Launcher is via Homebrew Cask:

```bash
# Add the tap (first time only)
brew tap wasilak/kube-ingress-launcher

# Install the application
brew install --cask kube-ingress-launcher
```

**Important: Bypassing macOS Gatekeeper**

Since this application is distributed unsigned (no Apple Developer certificate), you'll need to bypass Gatekeeper security warnings:

1. After installation, try to open the application from `/Applications`
2. macOS will show a security warning: "Kube Ingress Launcher cannot be opened because it is from an unidentified developer"
3. Click "OK" to dismiss the warning
4. Open **System Settings** > **Privacy & Security**
5. Scroll down to the **Security** section
6. You'll see a message: "Kube Ingress Launcher was blocked from use because it is not from an identified developer"
7. Click **"Open Anyway"**
8. Confirm by clicking **"Open"** in the dialog

You only need to do this once. After the first launch, macOS will remember your choice.

**Updating**:
```bash
brew upgrade --cask kube-ingress-launcher
```

**Uninstalling**:
```bash
brew uninstall --cask kube-ingress-launcher
```

### Option 2: Install from GitHub Releases

Download the latest DMG file from the [Releases page](https://github.com/wasilak/kube-ingress-launcher/releases):

1. Download the DMG file:
   - **Universal Binary**: `kube-ingress-launcher-X.Y.Z-universal-apple-darwin.dmg`
   - Works on both Apple Silicon (M1/M2/M3) and Intel Macs

2. Open the DMG file and drag the application to your Applications folder

3. Follow the Gatekeeper bypass steps above

**Verifying the Download**:

Each release includes SHA256 checksums. To verify your download:

```bash
# Download the checksum file
curl -LO https://github.com/wasilak/kube-ingress-launcher/releases/download/vX.Y.Z/checksums.txt

# Verify the DMG
shasum -a 256 -c checksums.txt
```

### Option 3: Build from Source

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd kube-ingress-launcher
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Build the application**:
   ```bash
   npm run tauri build
   ```

   The built application will be available in `src-tauri/target/release/bundle/macos/`

## Development

### Running in Development Mode

Start the development server with hot reload:

```bash
npm run tauri dev
```

This will:
- Start the Vite development server for the frontend
- Build and run the Rust backend
- Open the application window
- Enable hot reload for both frontend and backend changes

### Project Structure

```
kube-ingress-launcher/
├── src/                      # React frontend source
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript type definitions
│   └── styles/              # CSS files
├── src-tauri/               # Rust backend source
│   ├── src/
│   │   ├── main.rs         # Rust entry point
│   │   ├── commands/       # Tauri command handlers
│   │   ├── k8s/            # Kubernetes client
│   │   ├── state/          # Application state
│   │   ├── refresh/        # Background refresh
│   │   ├── settings/       # Settings management
│   │   └── error.rs        # Error types
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── tests/                   # Frontend tests
├── package.json            # Frontend dependencies
└── README.md               # This file
```

### Building for Production

Build the production application:

```bash
npm run tauri build
```

The application bundle will be created in:
- macOS: `src-tauri/target/release/bundle/macos/kube-ingress-launcher.app`

### Running Tests

**Frontend tests**:
```bash
npm test
```

**Backend tests**:
```bash
cd src-tauri
cargo test
```

**All tests**:
```bash
npm test && cd src-tauri && cargo test
```

## Usage

### First Launch

1. **Grant Accessibility Permission**: 
   - On first launch, the application will request Accessibility permission
   - This is required for the global keyboard shortcut to work
   - Go to System Settings > Privacy & Security > Accessibility
   - Enable the permission for the application

2. **Verify Kubernetes Connection**:
   - The application will automatically connect to your current Kubernetes context
   - Check the menu bar icon for connection status

### Keyboard Shortcuts

- **Cmd+Shift+K**: Show/hide the search window
- **Escape**: Hide the search window
- **Arrow Up/Down**: Navigate through ingress list
- **Enter**: Open the first URL of the selected ingress

### Menu Bar

Click the menu bar icon to access:
- **Show**: Display the search window (shows current shortcut)
- **Options**: Open settings dialog
- **Quit**: Exit the application

### Settings

Access settings via the menu bar "Options" item:

- **Global Shortcut**: Customize the keyboard shortcut
- **Refresh Interval**: Set how often to refresh ingress data (10-3600 seconds)
- **Autostart**: Enable/disable launching at login
- **Kubernetes Context**: Switch between different Kubernetes contexts
- **Version Information**: View application version, git branch (when running locally), commit hash, and build profile

All settings are automatically saved when changed.

**Version Display**: The Settings dialog shows comprehensive version information at the bottom:
- Application version from Cargo.toml
- Git branch (when running from source)
- Git commit hash (when running from source)
- Build profile (debug or release)

This information is useful for debugging and support purposes.

## Technology Stack

- **Frontend**: React 19, TypeScript, Mantine UI, Tailwind CSS
- **Backend**: Rust, Tauri v2, tokio (async runtime)
- **Kubernetes**: kube-rs (Kubernetes client library)
- **Build Tool**: Vite
- **Testing**: Jest (frontend), cargo test (backend)

## Troubleshooting

Having issues? Check out our [Troubleshooting Guide](docs/TROUBLESHOOTING.md) for solutions to common problems.

## License

GPL-3.0

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on the GitHub repository.

## Thanks

Special thanks to:

- The [Tauri](https://tauri.app/) team for creating an amazing framework for building desktop applications
- The [kube-rs](https://kube.rs/) community for the excellent Kubernetes client library
- The [Mantine](https://mantine.dev/) team for the beautiful React component library
- All contributors and users who help improve this project

Built with ❤️ for the Kubernetes community.
