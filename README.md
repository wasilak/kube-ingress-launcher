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

Download the latest DMG file from the [Releases page](https://github.com/wasilak/kube-ingress-desktop/releases):

1. Download the appropriate DMG for your Mac:
   - **Apple Silicon (M1/M2/M3)**: `kube-ingress-launcher-X.Y.Z-aarch64-apple-darwin.dmg`
   - **Intel**: `kube-ingress-launcher-X.Y.Z-x86_64-apple-darwin.dmg`

2. Open the DMG file and drag the application to your Applications folder

3. Follow the Gatekeeper bypass steps above

**Verifying the Download**:

Each release includes SHA256 checksums. To verify your download:

```bash
# Download the checksum file
curl -LO https://github.com/wasilak/kube-ingress-desktop/releases/download/vX.Y.Z/checksums-aarch64-apple-darwin.txt

# Verify the DMG
shasum -a 256 -c checksums-aarch64-apple-darwin.txt
```

### Option 3: Build from Source

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd kube-ingress-desktop
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
kube-ingress-desktop/
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
- macOS: `src-tauri/target/release/bundle/macos/kube-ingress-desktop.app`

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

## Troubleshooting

### Application Won't Start

**Symptoms**: Application fails to launch or crashes immediately

**Solutions**:
- Ensure Rust (1.70+) and Node.js (18+) are installed correctly
- Check that all dependencies are installed: `npm install`
- Try rebuilding: `npm run tauri build`
- Check console output for error messages: `npm run tauri dev`
- Verify Xcode Command Line Tools are installed: `xcode-select --install`

### Kubernetes Connection Fails

**Symptoms**: Error banner shows "Failed to connect to Kubernetes" or "Authentication failed"

**Solutions**:
- Verify your kubeconfig exists: `ls ~/.kube/config`
- Test cluster connectivity: `kubectl cluster-info`
- Check the active context: `kubectl config current-context`
- Ensure you have permissions to list ingresses: `kubectl get ingresses --all-namespaces`
- Try switching to a different context in Settings
- Check if your cluster credentials have expired
- Verify network connectivity to the cluster

### Global Shortcut Not Working

**Symptoms**: Pressing Cmd+Shift+K doesn't show the window

**Solutions**:
- Grant Accessibility permission in System Settings > Privacy & Security > Accessibility
- Restart the application after granting permission
- Try changing the shortcut in Settings if there's a conflict with another application
- Check if another application is using the same shortcut
- Verify the shortcut is displayed correctly in the menu bar menu
- Try using the menu bar "Show" option to verify the application is running

### No Ingresses Displayed

**Symptoms**: Window shows "No ingresses found" or empty list

**Solutions**:
- Verify ingresses exist in your cluster: `kubectl get ingresses --all-namespaces`
- Check for errors in the error banner at the top of the window
- Wait for the initial refresh to complete (may take a few seconds)
- Try manually refreshing by reopening the window
- Check if you have permissions to list ingresses in all namespaces
- Verify the correct Kubernetes context is selected in Settings

### Performance Issues

**Symptoms**: Slow search, high CPU usage, or laggy UI

**Solutions**:
- Reduce the refresh interval in Settings (increase the seconds value)
- Check the number of ingresses in your cluster (1000+ may cause slowness)
- Ensure your Kubernetes cluster is responsive
- Close and reopen the application to clear cached data
- Check system resources (CPU, memory) using Activity Monitor
- Verify network latency to your Kubernetes cluster

### Window Doesn't Hide

**Symptoms**: Window stays visible after pressing Escape or clicking away

**Solutions**:
- Try pressing Escape again
- Use the global shortcut (Cmd+Shift+K) to toggle the window
- Click the menu bar icon and select "Show" to toggle
- Restart the application if the issue persists

### Settings Not Persisting

**Symptoms**: Settings reset after restarting the application

**Solutions**:
- Check file permissions in `~/Library/Application Support/kube-ingress-desktop/`
- Verify the application has write permissions
- Try manually deleting the settings file and reconfiguring
- Check console logs for storage errors

### Autostart Not Working

**Symptoms**: Application doesn't launch at login

**Solutions**:
- Verify autostart is enabled in Settings
- Check System Settings > General > Login Items
- Manually add the application to Login Items if needed
- Restart your Mac to test
- Check if macOS security settings are blocking the autostart

### Build Errors

**Symptoms**: `npm run tauri build` fails with errors

**Solutions**:
- Ensure all dependencies are up to date: `npm install && cd src-tauri && cargo update`
- Clear build cache: `rm -rf node_modules dist src-tauri/target && npm install`
- Check Rust version: `rustc --version` (should be 1.70+)
- Check Node.js version: `node --version` (should be 18+)
- Verify Xcode Command Line Tools: `xcode-select -p`
- Check for disk space issues

### Error: "Kubeconfig not found or invalid"

**Symptoms**: Application shows kubeconfig error on startup

**Solutions**:
- Verify kubeconfig file exists: `ls -la ~/.kube/config`
- Check kubeconfig is valid YAML: `kubectl config view`
- Set KUBECONFIG environment variable if using custom location
- Ensure file has correct permissions: `chmod 600 ~/.kube/config`
- Try running `kubectl get nodes` to verify kubectl works

### High Memory Usage

**Symptoms**: Application uses excessive memory (>200MB)

**Solutions**:
- This may be normal with large numbers of ingresses (1000+)
- Restart the application to clear cached data
- Reduce refresh frequency to minimize memory churn
- Check for memory leaks by monitoring over time
- Report issue if memory grows continuously without bound

## Technology Stack

- **Frontend**: React 19, TypeScript, Mantine UI, Tailwind CSS
- **Backend**: Rust, Tauri v2, tokio (async runtime)
- **Kubernetes**: kube-rs (Kubernetes client library)
- **Build Tool**: Vite
- **Testing**: Jest (frontend), cargo test (backend)

## License

GPL-3.0

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on the GitHub repository.
