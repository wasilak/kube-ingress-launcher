# Requirements Document: Kubernetes Ingress Desktop Search

## Introduction

This specification defines the requirements for a standalone Tauri-based macOS desktop application that provides Spotlight-like search for Kubernetes ingress resources. The application runs as a menu bar utility, accessible via a global keyboard shortcut (Cmd+Shift+K), and displays ingress information in a compact, frameless window with native macOS vibrancy effects.

The application is built with Tauri v2, using React + TypeScript for the frontend and Rust for the backend. It connects to Kubernetes clusters using the user's kubeconfig, fetches ingress data periodically (every 60 seconds), and caches results in memory for instant display. When users select an ingress URL, it opens in their default browser.

## Glossary

- **Tauri**: A framework for building lightweight desktop applications using web technologies (HTML/CSS/JS) for the UI and Rust for the backend
- **Desktop_App**: The Tauri-based macOS application for ingress search
- **Spotlight_Interface**: A macOS-style search interface with frameless window, blur effects, and keyboard-driven interaction
- **Menu_Bar_App**: An application that appears in the macOS menu bar without a dock icon
- **Global_Shortcut**: A system-wide keyboard combination (Cmd+Shift+K) that activates the application
- **Ingress_Resource**: A Kubernetes resource that manages external access to services in a cluster (networking.k8s.io/v1/Ingress)
- **Vibrancy**: macOS native frosted-glass blur effect for window backgrounds
- **Background_Refresh**: Periodic polling of Kubernetes API (every 60 seconds) to update ingress list
- **Cache**: In-memory storage of ingress data that persists until application restart
- **kube-rs**: The official Rust client library for Kubernetes (kube.rs)
- **Kubeconfig**: YAML configuration file (~/.kube/config) containing Kubernetes cluster credentials and contexts
- **Login_Item**: A macOS system configuration that launches an application automatically at user login
- **Accessibility_Permission**: macOS permission required for global keyboard shortcut registration
- **Settings_Dialog**: A window for configuring application preferences with auto-save functionality
- **Tauri_Command**: A Rust function exposed to the frontend JavaScript via Tauri's IPC bridge

## Requirements

### Requirement 1: Application Window Configuration

**User Story:** As a macOS user, I want a Spotlight-like search interface, so that I can quickly find ingress resources without disrupting my workflow.

#### Acceptance Criteria

1. THE Desktop_App SHALL create a frameless window with transparent background
2. THE Desktop_App SHALL configure the window with alwaysOnTop set to true
3. THE Desktop_App SHALL configure the window with skipTaskbar set to true
4. THE Desktop_App SHALL set initial window dimensions to 600 pixels width and 400 pixels height
5. THE Desktop_App SHALL allow window resizing by the user
6. THE Desktop_App SHALL start with the window hidden
7. WHEN the application launches, THE Desktop_App SHALL not display a window until Global_Shortcut is triggered
8. THE Desktop_App SHALL apply vibrancy blur effect to the window background using NSVisualEffectMaterial::HudWindow
9. THE Desktop_App SHALL render rounded corners (12px border-radius) using CSS styling
10. THE Desktop_App SHALL center the window on the screen when shown

### Requirement 2: Global Keyboard Shortcut

**User Story:** As a user, I want to activate the search interface with a keyboard shortcut, so that I can access ingress information quickly from any application.

#### Acceptance Criteria

1. THE Desktop_App SHALL register a global keyboard shortcut (default: Cmd+Shift+K)
2. WHEN the Global_Shortcut is pressed and the window is hidden, THE Desktop_App SHALL show the window and focus the search input
3. WHEN the Global_Shortcut is pressed and the window is visible, THE Desktop_App SHALL hide the window
4. WHEN the user presses Escape key while the window is focused, THE Desktop_App SHALL hide the window
5. WHEN the window loses focus, THE Desktop_App SHALL hide the window automatically after 100ms delay
6. THE Desktop_App SHALL allow users to customize the Global_Shortcut in settings
7. WHEN the Global_Shortcut is changed, THE Desktop_App SHALL unregister the old shortcut and register the new one immediately

### Requirement 3: Menu Bar Application Behavior

**User Story:** As a user, I want the application to run as a menu bar app with a comprehensive menu, so that I can access all features and settings easily.

#### Acceptance Criteria

1. THE Desktop_App SHALL display an icon in the macOS menu bar
2. THE Desktop_App SHALL not display an icon in the dock
3. THE Desktop_App SHALL set LSUIElement to true in Info.plist to hide from dock
4. WHEN the user left-clicks the menu bar icon, THE Desktop_App SHALL display a dropdown menu
5. WHEN the user right-clicks the menu bar icon, THE Desktop_App SHALL display the same dropdown menu
6. THE menu SHALL include a "Show" menu item that displays the current Global_Shortcut (e.g., "Show (⌘⇧K)")
7. WHEN the user clicks the "Show" menu item, THE Desktop_App SHALL display the search window
8. THE menu SHALL include an "Options" menu item
9. WHEN the user clicks "Options", THE Desktop_App SHALL open the settings dialog window
10. THE menu SHALL include a "Quit" menu item
11. WHEN the user clicks "Quit", THE Desktop_App SHALL terminate the application gracefully

### Requirement 4: Kubernetes Connection and Configuration

**User Story:** As a user, I want the application to connect to my Kubernetes clusters using my existing kubeconfig, so that I don't need to configure credentials separately.

#### Acceptance Criteria

1. THE Desktop_App SHALL load Kubernetes configuration from ~/.kube/config by default
2. THE Desktop_App SHALL support the KUBECONFIG environment variable for custom configuration file paths
3. THE Desktop_App SHALL use the current-context from kubeconfig as the active cluster
4. THE Desktop_App SHALL validate Kubernetes credentials on application startup
5. WHEN Kubernetes credentials are invalid or cluster is unreachable, THE Desktop_App SHALL display an error message in the menu bar tooltip
6. THE Desktop_App SHALL provide a settings option to select a different context from kubeconfig
7. WHEN the user changes the active context, THE Desktop_App SHALL reconnect to the new cluster and refresh ingress data
8. THE Desktop_App SHALL display the active context name in the settings dialog

### Requirement 5: Ingress Data Model

**User Story:** As a developer, I want a clear data model for ingress resources, so that the application handles all relevant ingress information consistently.

#### Acceptance Criteria

1. THE Desktop_App SHALL define an IngressData type with the following fields: id (string), name (string), namespace (string), hosts (array of strings), paths (array of strings), urls (array of strings), annotations (key-value map), creationTimestamp (ISO 8601 string), tls (boolean), status (enum: ready/pending/error/unknown), labels (optional key-value map)
2. THE Desktop_App SHALL extract the id from the Kubernetes ingress UID (metadata.uid)
3. THE Desktop_App SHALL extract hosts from spec.rules[].host and spec.tls[].hosts
4. THE Desktop_App SHALL extract paths from spec.rules[].http.paths[].path
5. THE Desktop_App SHALL construct complete URLs by combining protocol (https if TLS, http otherwise), host, and path
6. THE Desktop_App SHALL filter out auto-generated annotations (kubectl.kubernetes.io/*, deployment.kubernetes.io/*, helm.sh/*, meta.helm.sh/*)
7. THE Desktop_App SHALL preserve user-defined annotations and labels
8. THE Desktop_App SHALL set status to "unknown" (actual status determination is out of scope for MVP)

### Requirement 6: Background Refresh and Caching

**User Story:** As a user, I want the ingress list to refresh periodically in the background, so that I have reasonably current information without complex real-time connections.

#### Acceptance Criteria

1. THE Desktop_App SHALL fetch all ingress resources from all namespaces in the active Kubernetes cluster
2. THE Desktop_App SHALL perform the initial fetch on application startup before allowing the window to be shown
3. THE Desktop_App SHALL fetch ingress data from Kubernetes API every 60 seconds in the background (configurable)
4. THE Desktop_App SHALL store fetched ingress data in memory (Tauri state)
5. WHEN the user opens the search window, THE Desktop_App SHALL display ingresses from Cache immediately
6. WHEN Background_Refresh succeeds, THE Desktop_App SHALL update Cache with new data and clear any previous errors
7. WHEN Background_Refresh fails, THE Desktop_App SHALL continue displaying the last successful Cache data
8. WHEN Background_Refresh fails, THE Desktop_App SHALL store the error message and timestamp
9. WHEN the application restarts, THE Desktop_App SHALL clear Cache and fetch fresh data
10. THE Desktop_App SHALL extend Cache lifetime indefinitely when Background_Refresh fails to ensure users always see some data
11. THE Desktop_App SHALL implement exponential backoff for failed refresh attempts (100ms, 200ms, 400ms, max 5 seconds)

### Requirement 7: Search and Display Interface

**User Story:** As a user, I want to search and filter ingress resources by name, namespace, or host, so that I can quickly find the ingress I need.

#### Acceptance Criteria

1. THE Desktop_App SHALL display a search input field at the top of the window
2. WHEN the window is shown, THE Desktop_App SHALL automatically focus the search input field
3. WHEN the user types in the search field, THE Desktop_App SHALL filter ingresses by name, namespace, host, or URL (case-insensitive substring match)
4. THE Desktop_App SHALL debounce search input with 150 millisecond delay
5. THE Desktop_App SHALL display filtered ingress results in a scrollable list below the search input
6. THE Desktop_App SHALL display ingress name, namespace, and hosts for each result item
7. THE Desktop_App SHALL show a placeholder message "No ingresses found" when the filtered list is empty
8. THE Desktop_App SHALL show a loading indicator during initial data fetch
9. WHEN an error occurred during the last refresh, THE Desktop_App SHALL display an error banner at the top with the error message and a "Copy Error" button
10. THE Desktop_App SHALL limit the displayed list to 50 items for performance (show "X more results" message if filtered list is longer)

### Requirement 8: Ingress Selection and URL Opening

**User Story:** As a user, I want to select an ingress and open its URLs in my default browser, so that I can quickly access the services.

#### Acceptance Criteria

1. WHEN the user clicks on an ingress item in the list, THE Desktop_App SHALL expand the item to show all available URLs
2. WHEN the user clicks on a URL within an expanded ingress item, THE Desktop_App SHALL open the URL in the default system browser using Tauri's shell plugin
3. WHEN the user presses Enter on a selected ingress item, THE Desktop_App SHALL open the first URL in the default system browser
4. WHEN a URL is opened, THE Desktop_App SHALL hide the search window
5. THE Desktop_App SHALL implement keyboard navigation: Arrow Up/Down to navigate items, Enter to select, Escape to close
6. THE Desktop_App SHALL highlight the currently selected item with a subtle background color

### Requirement 9: Settings and Configuration

**User Story:** As a user, I want to configure application settings with auto-save, so that I can customize the behavior to my preferences without manual save actions.

#### Acceptance Criteria

1. THE Desktop_App SHALL provide a settings dialog window accessible from the menu bar "Options" menu item
2. THE Desktop_App SHALL display the settings dialog as a separate window (not modal) with dimensions 500x400 pixels
3. THE settings dialog SHALL include a keyboard shortcut configuration section
4. WHEN the user clicks the "Record Shortcut" button, THE Desktop_App SHALL enter recording mode and display "Press keys..."
5. WHEN in recording mode, THE Desktop_App SHALL capture the next key combination pressed by the user
6. WHEN a key combination is captured, THE Desktop_App SHALL validate it is not a system-reserved shortcut (Cmd+Q, Cmd+Tab, Cmd+Space, Cmd+W, Cmd+H, Cmd+M, Cmd+Option+Esc)
7. WHEN a valid shortcut is captured, THE Desktop_App SHALL update the Global_Shortcut immediately and display it in the menu
8. WHEN an invalid shortcut is captured, THE Desktop_App SHALL display an error message and keep the previous shortcut
9. THE settings dialog SHALL include a refresh interval configuration field (numeric input in seconds)
10. WHEN the user modifies the refresh interval, THE Desktop_App SHALL validate it is between 10 and 3600 seconds
11. WHEN the refresh interval is changed, THE Desktop_App SHALL apply the new interval to the background refresh task immediately
12. THE settings dialog SHALL include an "Autostart with system" toggle switch
13. WHEN the autostart toggle is enabled, THE Desktop_App SHALL register itself as a macOS login item
14. WHEN the autostart toggle is disabled, THE Desktop_App SHALL remove itself from macOS login items
15. THE settings dialog SHALL include a Kubernetes context selector dropdown
16. THE Desktop_App SHALL populate the context dropdown with all contexts from kubeconfig
17. WHEN the user selects a different context, THE Desktop_App SHALL switch to that context and refresh ingress data
18. THE Desktop_App SHALL automatically save all settings changes immediately without requiring a save button
19. THE Desktop_App SHALL persist settings to disk using Tauri's store plugin (JSON file in app data directory)
20. WHEN the application restarts, THE Desktop_App SHALL load and apply saved settings

### Requirement 10: macOS Permissions Management

**User Story:** As a user, I want clear guidance when permissions are needed, so that I can grant them and use all features.

#### Acceptance Criteria

1. WHEN the application first attempts to register a Global_Shortcut, THE Desktop_App SHALL check for Accessibility_Permission
2. WHEN Accessibility_Permission is not granted, THE Desktop_App SHALL display a dialog explaining: "Keyboard shortcuts require Accessibility permission. Please grant permission in System Settings > Privacy & Security > Accessibility."
3. THE permission dialog SHALL include a button "Open System Settings" that opens System Settings to the Accessibility pane
4. WHEN the user enables autostart, THE Desktop_App SHALL attempt to register as a Login_Item
5. WHEN Login_Item registration fails, THE Desktop_App SHALL display an error message: "Could not enable autostart. Please check System Settings > General > Login Items."
6. THE Desktop_App SHALL gracefully handle missing Accessibility_Permission by disabling the global shortcut feature and showing a warning in the menu
7. WHEN Accessibility_Permission is granted while the app is running, THE Desktop_App SHALL detect the change and enable the global shortcut feature
8. THE Desktop_App SHALL check permissions on startup and display appropriate warnings in the menu bar tooltip if permissions are missing

### Requirement 11: Error Handling and Resilience

**User Story:** As a user, I want the application to handle errors gracefully, so that temporary issues don't disrupt my workflow.

#### Acceptance Criteria

1. WHEN Kubernetes API is unreachable, THE Desktop_App SHALL display the last cached ingress data with an error banner
2. WHEN Kubernetes authentication fails, THE Desktop_App SHALL display an error message: "Authentication failed. Please check your kubeconfig credentials."
3. WHEN kubeconfig file is missing or invalid, THE Desktop_App SHALL display an error message: "Kubeconfig not found or invalid. Please ensure ~/.kube/config exists and is valid."
4. WHEN an error occurs during background refresh, THE Desktop_App SHALL log the error to console and store it for display in the UI
5. WHEN the window fails to show/hide, THE Desktop_App SHALL log the error but continue running
6. WHEN shortcut registration fails, THE Desktop_App SHALL display an error in the menu bar tooltip and allow manual window opening via menu
7. THE Desktop_App SHALL never crash due to errors; all errors SHALL be caught and handled gracefully
8. THE Desktop_App SHALL implement retry logic with exponential backoff for transient Kubernetes API errors
9. THE Desktop_App SHALL log all errors to a log file in the app data directory for troubleshooting

### Requirement 12: User Interface Components

**User Story:** As a developer, I want well-defined UI components, so that the interface is consistent and maintainable.

#### Acceptance Criteria

1. THE Desktop_App SHALL use React 19 for the frontend UI framework
2. THE Desktop_App SHALL use Mantine UI v8 for UI components (Button, TextInput, Stack, Group, Alert, Modal, Switch, Select)
3. THE Desktop_App SHALL use Tailwind CSS for custom styling
4. THE Desktop_App SHALL implement a SearchInput component with auto-focus, debounced onChange, and clear button
5. THE Desktop_App SHALL implement an IngressList component that displays filtered ingresses with virtualization for performance
6. THE Desktop_App SHALL implement an IngressItem component that shows name, namespace, hosts, and expandable URL list
7. THE Desktop_App SHALL implement an ErrorBanner component that displays error message and "Copy Error" button
8. THE Desktop_App SHALL implement a SettingsDialog component with all configuration options
9. THE Desktop_App SHALL use Mantine's Stack for vertical layouts and Group for horizontal layouts (no Tailwind flex classes)
10. THE Desktop_App SHALL apply a semi-transparent dark background (rgba(0, 0, 0, 0.7)) to the window content for readability over vibrancy

### Requirement 13: Rust Backend Architecture

**User Story:** As a developer, I want a well-structured Rust backend, so that the application is performant and maintainable.

#### Acceptance Criteria

1. THE Desktop_App SHALL use kube-rs (kube crate) for Kubernetes API communication
2. THE Desktop_App SHALL use tokio runtime for async operations
3. THE Desktop_App SHALL use serde for JSON serialization/deserialization
4. THE Desktop_App SHALL define Tauri_Command functions for: get_ingresses, open_url, get_settings, update_settings, get_contexts, switch_context
5. THE Desktop_App SHALL use Tauri's state management (Arc<RwLock<T>>) to store: ingresses cache, last error, last updated timestamp, settings
6. THE Desktop_App SHALL implement a background task using tokio::spawn that runs the refresh loop
7. THE Desktop_App SHALL implement a K8sClient struct that wraps kube::Client and provides methods: new(), list_ingresses(), get_contexts(), switch_context()
8. THE Desktop_App SHALL implement a transform_ingress function that converts k8s_openapi::api::networking::v1::Ingress to IngressData
9. THE Desktop_App SHALL handle all errors in Tauri commands and return Result<T, String> where String is a user-friendly error message
10. THE Desktop_App SHALL use tauri-plugin-global-shortcut for keyboard shortcut registration
11. THE Desktop_App SHALL use tauri-plugin-shell for opening URLs
12. THE Desktop_App SHALL use tauri-plugin-store for settings persistence
13. THE Desktop_App SHALL use window-vibrancy crate for macOS blur effects

### Requirement 14: Build and Distribution

**User Story:** As a developer, I want streamlined build and distribution, so that I can easily create distributable macOS applications.

#### Acceptance Criteria

1. THE Desktop_App SHALL use Tauri CLI for building: npm run tauri build
2. THE Desktop_App SHALL produce a .app bundle in src-tauri/target/release/bundle/macos/
3. THE Desktop_App SHALL include a proper Info.plist with LSUIElement set to true
4. THE Desktop_App SHALL include an application icon (1024x1024 PNG) in src-tauri/icons/
5. THE Desktop_App SHALL configure code signing in tauri.conf.json (optional for development, required for distribution)
6. THE Desktop_App SHALL support development mode with hot reload: npm run tauri dev
7. THE Desktop_App SHALL include a README with: project description, prerequisites (Rust, Node.js, kubeconfig), build instructions, usage instructions
8. THE Desktop_App SHALL include a LICENSE file (GPL-3.0 to match the web app)
9. THE Desktop_App SHALL configure Cargo.toml with appropriate dependencies and metadata
10. THE Desktop_App SHALL configure package.json with appropriate scripts and dependencies

### Requirement 15: Data Structures Reference

**User Story:** As a developer, I want clear documentation of Kubernetes ingress structure, so that I can correctly extract data without referring to external documentation.

#### Acceptance Criteria

1. THE specification SHALL document the Kubernetes Ingress API structure (networking.k8s.io/v1)
2. THE specification SHALL document that ingress hosts are found in: spec.rules[].host and spec.tls[].hosts
3. THE specification SHALL document that ingress paths are found in: spec.rules[].http.paths[].path
4. THE specification SHALL document that ingress backend services are found in: spec.rules[].http.paths[].backend.service.name and .port.number
5. THE specification SHALL document that TLS configuration is found in: spec.tls[] with hosts and secretName
6. THE specification SHALL document that annotations are found in: metadata.annotations
7. THE specification SHALL document that labels are found in: metadata.labels
8. THE specification SHALL document that creation timestamp is found in: metadata.creationTimestamp
9. THE specification SHALL document that UID is found in: metadata.uid
10. THE specification SHALL provide example Kubernetes ingress YAML for reference

### Requirement 16: Performance Requirements

**User Story:** As a user, I want the application to be fast and responsive, so that it doesn't slow down my workflow.

#### Acceptance Criteria

1. THE Desktop_App SHALL show the search window within 100ms of Global_Shortcut press
2. THE Desktop_App SHALL display cached ingress data within 50ms of window opening
3. THE Desktop_App SHALL filter and update the ingress list within 150ms of search input (including debounce)
4. THE Desktop_App SHALL use virtualization for the ingress list to handle 1000+ ingresses without performance degradation
5. THE Desktop_App SHALL consume less than 50MB of RAM when idle (window hidden)
6. THE Desktop_App SHALL consume less than 100MB of RAM when active (window shown with 1000 ingresses)
7. THE Desktop_App SHALL perform background refresh in a separate thread without blocking the UI
8. THE Desktop_App SHALL start up within 2 seconds on a modern Mac

### Requirement 17: Testing Requirements

**User Story:** As a developer, I want comprehensive tests, so that I can ensure code quality and catch regressions.

#### Acceptance Criteria

1. THE Desktop_App SHALL include unit tests for Rust functions: transform_ingress, filter_ingresses, validate_shortcut, validate_refresh_interval
2. THE Desktop_App SHALL include property-based tests using proptest for: ingress transformation (any valid k8s ingress produces valid IngressData), filtering (any search term produces correct results), settings validation (any input is correctly validated)
3. THE Desktop_App SHALL include integration tests for Tauri commands: get_ingresses returns cached data, update_settings persists to disk, switch_context changes active cluster
4. THE Desktop_App SHALL include React component tests using @testing-library/react for: SearchInput, IngressList, IngressItem, ErrorBanner, SettingsDialog
5. THE Desktop_App SHALL configure Jest for frontend tests and cargo test for backend tests
6. THE Desktop_App SHALL run all tests in CI/CD pipeline
7. THE Desktop_App SHALL achieve minimum 70% code coverage for Rust backend
8. THE Desktop_App SHALL tag property tests with comments: "Feature: kube-ingress-desktop, Property N: [description]"
9. THE Desktop_App SHALL run property tests with minimum 100 iterations

## Kubernetes Ingress API Reference

For implementation reference, here is the structure of a Kubernetes Ingress resource (networking.k8s.io/v1):

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: example-ingress
  namespace: default
  uid: "550e8400-e29b-41d4-a716-446655440000"
  creationTimestamp: "2024-01-15T10:30:00Z"
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-prod
  labels:
    app: example
    environment: production
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - example.com
        - www.example.com
      secretName: example-tls
  rules:
    - host: example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 8080
          - path: /web
            pathType: Prefix
            backend:
              service:
                name: web-service
                port:
                  number: 80
    - host: www.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-service
                port:
                  number: 80
status:
  loadBalancer:
    ingress:
      - ip: 203.0.113.42
```

**Key Fields for Extraction:**
- **Hosts**: `spec.rules[].host` and `spec.tls[].hosts` (combine and deduplicate)
- **Paths**: `spec.rules[].http.paths[].path`
- **TLS**: `spec.tls` exists and has entries → tls = true
- **URLs**: Construct from protocol (https if TLS, http otherwise) + host + path
- **Annotations**: `metadata.annotations` (filter out auto-generated ones)
- **Labels**: `metadata.labels`
- **Timestamps**: `metadata.creationTimestamp` (ISO 8601 format)
- **ID**: `metadata.uid`
