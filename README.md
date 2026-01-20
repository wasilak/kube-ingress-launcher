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

All settings are automatically saved when changed.

## Troubleshooting

### Application Won't Start

- Ensure Rust and Node.js are installed correctly
- Check that all dependencies are installed: `npm install`
- Try rebuilding: `npm run tauri build`

### Kubernetes Connection Fails

- Verify your kubeconfig exists: `ls ~/.kube/config`
- Test cluster connectivity: `kubectl cluster-info`
- Check the active context: `kubectl config current-context`
- Ensure you have permissions to list ingresses: `kubectl get ingresses --all-namespaces`

### Global Shortcut Not Working

- Grant Accessibility permission in System Settings
- Restart the application after granting permission
- Try changing the shortcut in Settings if there's a conflict

### No Ingresses Displayed

- Verify ingresses exist in your cluster: `kubectl get ingresses --all-namespaces`
- Check for errors in the error banner at the top of the window
- Wait for the initial refresh to complete (may take a few seconds)

### Performance Issues

- Reduce the refresh interval in Settings
- Check the number of ingresses in your cluster
- Ensure your Kubernetes cluster is responsive

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
