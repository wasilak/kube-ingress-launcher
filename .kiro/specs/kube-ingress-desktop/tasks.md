# Implementation Plan: Kubernetes Ingress Desktop Search

## Overview

This implementation plan breaks down the development of the Tauri-based macOS desktop application into discrete, incremental tasks. Each task builds on previous work and includes testing to validate functionality early.

## Tasks

- [x] 1. Project Scaffolding and Initial Setup
  - Initialize Tauri project with React + TypeScript template
  - Configure Vite, TypeScript, Tailwind CSS, and Mantine UI
  - Set up project structure (src/, src-tauri/, tests/)
  - Configure Cargo.toml with required dependencies (kube, tokio, serde, tauri plugins)
  - Configure tauri.conf.json with window settings (frameless, transparent, alwaysOnTop, skipTaskbar, hidden)
  - Create README with project description and setup instructions
  - _Requirements: 14.1, 14.2, 14.6, 14.7_

- [x] 2. TypeScript Type Definitions
  - Create src/types/ingress.ts with IngressData, ErrorInfo, Settings, IngressResponse interfaces
  - Ensure types match the Kubernetes ingress structure documented in requirements
  - _Requirements: 5.1, 15.1-15.10_

- [x] 3. Rust Data Models and State Management
  - [x] 3.1 Create src-tauri/src/state/app_state.rs with IngressData, ErrorInfo, AppState structs
    - Implement Clone, Serialize, Deserialize derives
    - Use Arc<RwLock<T>> for thread-safe state
    - _Requirements: 5.1, 13.5_

  - [ ]* 3.2 Write unit tests for state initialization
    - Test AppState::new() creates empty state
    - _Requirements: 17.1_

- [x] 4. Kubernetes Client Implementation
  - [x] 4.1 Create src-tauri/src/k8s/client.rs with K8sClient struct
    - Implement K8sClient::new() using kube::Config::infer()
    - Implement list_ingresses() using kube::Api<Ingress>
    - Handle kubeconfig loading errors gracefully
    - _Requirements: 4.1, 4.2, 4.3, 13.1, 13.7_

  - [ ]* 4.2 Write unit tests for K8sClient
    - Test kubeconfig loading with valid config
    - Test error handling for missing kubeconfig
    - _Requirements: 17.1_

- [x] 5. Ingress Transformation Logic
  - [x] 5.1 Create src-tauri/src/k8s/transform.rs with transform_ingress function
    - Extract name, namespace, id from metadata
    - Extract hosts from spec.rules[].host and spec.tls[].hosts (deduplicate)
    - Extract paths from spec.rules[].http.paths[].path
    - Construct URLs from protocol (https if TLS) + host + path
    - Filter auto-generated annotations (kubectl.kubernetes.io/*, helm.sh/*, etc.)
    - Set TLS boolean based on spec.tls presence
    - _Requirements: 5.1-5.8, 13.8_

  - [ ]* 5.2 Write property test for ingress transformation
    - **Property 1: Ingress Transformation Correctness**
    - **Validates: Requirements 5.1-5.8**
    - Generate random Kubernetes ingress objects
    - Verify name, namespace, hosts, paths, TLS are correctly extracted
    - _Requirements: 17.2_

  - [ ]* 5.3 Write unit tests for edge cases
    - Test ingress with no hosts
    - Test ingress with no paths
    - Test ingress with TLS
    - Test annotation filtering
    - _Requirements: 17.1_

- [x] 6. Background Refresh Task
  - [x] 6.1 Create src-tauri/src/refresh/task.rs with start_refresh_task function
    - Use tokio::time::interval for periodic refresh
    - Fetch ingresses using K8sClient
    - Transform ingresses using transform_ingress
    - Update AppState with new data
    - Handle errors and store in last_error
    - Emit "ingresses-updated" event to frontend
    - _Requirements: 6.1-6.11, 13.6_

  - [ ]* 6.2 Write integration tests for refresh task
    - Test successful refresh updates state
    - Test failed refresh preserves cached data
    - Test error is stored in state
    - _Requirements: 17.3_

- [x] 7. Tauri Commands
  - [x] 7.1 Create src-tauri/src/commands/ingresses.rs
    - Implement get_ingresses command (returns IngressResponse)
    - Implement open_url command (uses tauri-plugin-shell)
    - _Requirements: 7.1-7.4, 8.1-8.4, 13.4_

  - [x] 7.2 Create src-tauri/src/commands/settings.rs
    - Implement get_settings command
    - Implement update_settings command with validation
    - Validate refresh interval (10-3600 seconds)
    - _Requirements: 9.1-9.20, 13.4_

  - [x] 7.3 Create src-tauri/src/commands/kubernetes.rs
    - Implement get_contexts command
    - Implement switch_context command
    - _Requirements: 4.6, 4.7, 9.15-9.17, 13.4_

  - [ ]* 7.4 Write integration tests for Tauri commands
    - Test get_ingresses returns cached data
    - Test update_settings validates and persists
    - Test switch_context changes active cluster
    - _Requirements: 17.3_

- [x] 8. Settings Persistence
  - [x] 8.1 Create src-tauri/src/settings/store.rs
    - Implement load_settings using tauri-plugin-store
    - Implement save_settings using tauri-plugin-store
    - Use Settings::default() for missing settings
    - _Requirements: 9.18-9.20, 13.12_

  - [ ]* 8.2 Write property test for settings persistence
    - **Property 4: Settings Persistence**
    - **Validates: Requirements 9.18-9.20**
    - Generate random valid settings
    - Save, reload, and verify equality
    - _Requirements: 17.2_

- [x] 9. Error Handling
  - [x] 9.1 Create src-tauri/src/error.rs with AppError enum
    - Define KubernetesError, SettingsError, PermissionError, SystemError variants
    - Implement From<AppError> for String
    - _Requirements: 11.1-11.9, 13.9_

  - [ ]* 9.2 Write property test for error resilience
    - **Property 5: Error Resilience**
    - **Validates: Requirements 11.7**
    - Simulate various errors
    - Verify application continues running
    - _Requirements: 17.2_

- [x] 10. Main Rust Entry Point
  - [x] 10.1 Implement src-tauri/src/main.rs
    - Initialize AppState and manage it with Tauri
    - Setup window vibrancy using window-vibrancy crate
    - Setup menu bar tray with Show, Options, Quit items
    - Register global shortcut (Cmd+Shift+K) using tauri-plugin-global-shortcut
    - Start background refresh task
    - Register all Tauri command handlers
    - _Requirements: 1.1-1.10, 2.1-2.7, 3.1-3.11, 13.10, 13.11_

  - [ ]* 10.2 Write integration tests for main setup
    - Test tray menu is created
    - Test global shortcut is registered
    - Test window starts hidden
    - _Requirements: 17.3_

- [x] 11. Frontend: SearchInput Component
  - [x] 11.1 Create src/components/SearchInput.tsx
    - Use Mantine TextInput with IconSearch
    - Implement auto-focus
    - Use useDebouncedValue hook (150ms)
    - _Requirements: 7.2, 7.4, 12.4_

  - [ ]* 11.2 Write component tests for SearchInput
    - Test auto-focus on mount
    - Test debouncing behavior
    - _Requirements: 17.4_

- [x] 12. Frontend: IngressList and IngressItem Components
  - [x] 12.1 Create src/components/IngressList.tsx
    - Use Mantine Stack for layout
    - Display first 50 ingresses with "X more results" message
    - Show "No ingresses found" when empty
    - _Requirements: 7.5, 7.10, 12.5_

  - [x] 12.2 Create src/components/IngressItem.tsx
    - Display name, namespace, hosts, TLS badge
    - Implement expandable URL list
    - Call open_url Tauri command on URL click
    - _Requirements: 7.5, 7.6, 8.1-8.4, 12.6_

  - [ ]* 12.3 Write component tests for IngressList and IngressItem
    - Test ingress display with all required fields
    - Test "No ingresses found" message
    - Test URL click calls open_url
    - _Requirements: 17.4_

- [x] 13. Frontend: ErrorBanner Component
  - [x] 13.1 Create src/components/ErrorBanner.tsx
    - Use Mantine Alert with error color
    - Display error message and timestamp
    - Implement "Copy Error" button using navigator.clipboard
    - _Requirements: 7.9, 12.7_

  - [ ]* 13.2 Write component tests for ErrorBanner
    - Test error message display
    - Test copy button functionality
    - _Requirements: 17.4_

- [x] 14. Frontend: SettingsDialog Component
  - [x] 14.1 Create src/components/SettingsDialog.tsx
    - Use Mantine Modal
    - Implement shortcut recorder with "Record" button
    - Implement refresh interval NumberInput (10-3600 validation)
    - Implement autostart Switch
    - Implement Kubernetes context Select
    - Call update_settings on every change (auto-save)
    - _Requirements: 9.1-9.20, 12.8_

  - [ ]* 14.2 Write component tests for SettingsDialog
    - Test all settings fields render
    - Test validation for refresh interval
    - Test auto-save on change
    - _Requirements: 17.4_

- [ ] 14.5 Add Kubeconfig Path Configuration to Settings
  - [ ] 14.5.1 Add kubeconfig path field to Settings struct in Rust
    - Add `kubeconfig_path: Option<String>` to Settings struct
    - Default to None (uses ~/.kube/config)
    - Persist to settings store
    - _Requirements: 4.1, 4.2, 9.18-9.20_

  - [ ] 14.5.2 Update K8sClient to use custom kubeconfig path
    - Modify K8sClient::new() to accept optional kubeconfig path
    - Use Config::from_kubeconfig() when custom path is provided
    - Fall back to Config::infer() when path is None
    - Handle file not found errors gracefully
    - _Requirements: 4.1, 4.2, 11.3_

  - [ ] 14.5.3 Add Tauri commands for kubeconfig path management
    - Implement get_kubeconfig_path command
    - Implement set_kubeconfig_path command with validation
    - Validate file exists and is readable
    - Trigger ingress refresh after path change
    - _Requirements: 4.1, 4.2, 9.18-9.20_

  - [ ] 14.5.4 Add kubeconfig path input to SettingsDialog
    - Add TextInput for kubeconfig path with file picker button
    - Display current path or "Default (~/.kube/config)" placeholder
    - Add "Browse..." button to open file picker dialog
    - Show validation error if file doesn't exist
    - Auto-save on change
    - _Requirements: 9.1-9.20_

  - [ ]* 14.5.5 Write tests for kubeconfig path configuration
    - Test K8sClient with custom path
    - Test K8sClient falls back to default
    - Test error handling for invalid paths
    - Test settings persistence
    - _Requirements: 17.1, 17.3_

- [x] 15. Frontend: Custom Hooks
  - [x] 15.1 Create src/hooks/useIngresses.ts
    - Call get_ingresses Tauri command
    - Listen for "ingresses-updated" events
    - Return ingresses, loading, error, lastUpdated
    - _Requirements: 6.1-6.11_

  - [x] 15.2 Create src/hooks/useSearch.ts
    - Implement filtering logic (name, namespace, host, URL)
    - Use useMemo for performance
    - _Requirements: 7.3_

  - [ ]* 15.3 Write property test for search filtering
    - **Property 2: Search Filtering Correctness**
    - **Validates: Requirements 7.3**
    - Generate random ingress lists and search terms
    - Verify filtering returns only matching ingresses
    - _Requirements: 17.2_

- [x] 16. Frontend: Main App Component
  - [x] 16.1 Create src/App.tsx
    - Use Mantine Stack for layout
    - Integrate SearchInput, IngressList, ErrorBanner, SettingsDialog
    - Use useIngresses and useSearch hooks
    - Apply semi-transparent dark background (rgba(0, 0, 0, 0.7))
    - _Requirements: 7.1-7.10, 12.10_

  - [x] 16.2 Create src/main.tsx
    - Setup React root
    - Wrap App with MantineProvider
    - _Requirements: 12.1_

  - [x] 16.3 Create src/styles/index.css
    - Configure Tailwind CSS
    - Add custom styles for vibrancy background
    - Add rounded corners (12px border-radius)
    - _Requirements: 1.9, 12.3_

- [x] 17. macOS Permissions Handling
  - [x] 17.1 Implement accessibility permission check
    - Check for accessibility permission on shortcut registration
    - Display dialog with explanation and "Open System Settings" button
    - _Requirements: 10.1-10.3_

  - [x] 17.2 Implement autostart permission handling
    - Use tauri-plugin-autostart for login item registration
    - Handle registration failures gracefully
    - _Requirements: 10.4-10.5_

  - [ ]* 17.3 Write integration tests for permissions
    - Test permission check on startup
    - Test graceful degradation without permissions
    - _Requirements: 17.3_

- [x] 18. Window Behavior and Focus Management
  - [x] 18.1 Implement window show/hide logic
    - Hide window on Escape key press
    - Hide window on focus loss (100ms delay)
    - Center window on show
    - _Requirements: 2.4, 2.5, 2.6_

  - [x] 18.2 Implement keyboard navigation
    - Arrow Up/Down to navigate ingress list
    - Enter to select ingress
    - Escape to close window
    - _Requirements: 8.5, 11.4_

- [x] 19. Build Configuration and Icons
  - [x] 19.1 Create application icon
    - Design 1024x1024 PNG icon
    - Place in src-tauri/icons/icon.png
    - _Requirements: 14.4_

  - [x] 19.2 Configure Info.plist
    - Set LSUIElement to true
    - Configure bundle identifier
    - _Requirements: 14.3_

  - [x] 19.3 Test build process
    - Run npm run tauri build
    - Verify .app bundle is created
    - Test application launches and functions correctly
    - _Requirements: 14.2_

- [x] 20. Documentation
  - [x] 20.1 Write comprehensive README
    - Project description
    - Prerequisites (Rust, Node.js, kubeconfig)
    - Installation instructions
    - Build instructions (dev and production)
    - Usage instructions (keyboard shortcuts, settings)
    - Troubleshooting section
    - _Requirements: 14.7_

  - [x] 20.2 Add LICENSE file
    - Copy GPL-3.0 license
    - _Requirements: 14.8_

  - [x] 20.3 Add inline code documentation
    - Document all public functions and structs
    - Add JSDoc comments to TypeScript code
    - _Requirements: 14.7_

- [x] 20.4 Fix Menu Bar Dynamic Show/Hide Label
  - [x] 20.4.1 Update tray menu "Show" item to dynamically change based on window state
    - Change menu item text to "Show" when window is hidden
    - Change menu item text to "Hide" when window is visible
    - Update menu item on window show/hide events
    - _Requirements: 3.1-3.11_

  - [x] 20.4.2 Add window state tracking
    - Listen for window show/hide events
    - Update tray menu item label accordingly
    - Ensure menu reflects current window state
    - _Requirements: 3.1-3.11_

- [x] 20.4.5 Verify and Fix Escape Key and Focus Loss Behavior
  - [x] 20.4.5.1 Verify useWindowBehavior hook is properly integrated
    - Confirm useWindowBehavior is called in App.tsx
    - Test Escape key hides window in development mode
    - Test clicking outside window hides it after 100ms
    - Add console logging for debugging if not working
    - _Requirements: 2.4, 2.5, 8.5_

  - [x] 20.4.5.2 Fix any issues with window hide behavior
    - Ensure Tauri window.hide() is being called correctly
    - Verify no event propagation issues preventing Escape key
    - Check that blur events are firing correctly
    - Test with different focus scenarios (clicking outside, switching apps)
    - _Requirements: 2.4, 2.5, 2.6_

- [x] 20.5 Fix Kubernetes Client Configuration Loading
  - [x] 20.5.1 Ensure K8sClient properly loads kubeconfig from default path
    - Verify Config::infer() correctly finds ~/.kube/config
    - Add better error messages for authentication failures
    - Log the kubeconfig path being used for debugging
    - _Requirements: 4.1, 4.2, 11.2, 11.3_

  - [x] 20.5.2 Add kubeconfig validation on startup
    - Check if kubeconfig file exists before attempting connection
    - Validate kubeconfig has valid current-context
    - Display helpful error message if kubeconfig is missing or invalid
    - _Requirements: 4.4, 11.3_

  - [x] 20.5.3 Handle authentication errors gracefully
    - Catch 401 Unauthorized errors specifically
    - Display user-friendly error message about credentials
    - Suggest checking kubeconfig and cluster connectivity
    - Continue running app with cached data if available
    - _Requirements: 11.1, 11.2, 11.7_

- [x] 21. Mantine Theme Support (Light/Dark/System)
  - [x] 21.1 Add theme configuration to Settings
    - Add `theme: 'light' | 'dark' | 'system'` field to Settings struct in Rust
    - Default to 'system' theme
    - Persist theme preference to settings store
    - Add get_theme and set_theme Tauri commands
    - _Requirements: 9.18-9.20_

  - [x] 21.2 Implement theme detection and application
    - Create useTheme hook to manage theme state
    - Detect system theme preference using window.matchMedia('(prefers-color-scheme: dark)')
    - Listen for system theme changes when theme is set to 'system'
    - Apply theme to MantineProvider colorScheme prop
    - _Requirements: 12.1, 12.2_

  - [x] 21.3 Add theme selector to SettingsDialog
    - Add Select component with options: 'Light', 'Dark', 'System'
    - Display current theme selection
    - Auto-save theme changes immediately
    - Update UI theme in real-time when changed
    - _Requirements: 9.1-9.20, 12.8_

  - [ ]* 21.4 Write tests for theme functionality
    - Test theme persistence across restarts
    - Test system theme detection
    - Test theme switching updates UI
    - _Requirements: 17.1, 17.3_

- [ ] 22. Search Window UX Improvements
  - [ ] 22.1 Increase search window size by 20%
    - Update window dimensions in tauri.conf.json from 600x400 to 720x480
    - Adjust CSS if needed to accommodate larger window
    - Test window centering still works correctly
    - _Requirements: 1.4, 1.10_

  - [ ] 22.2 Implement auto-close on focus loss
    - Ensure useWindowBehavior hook properly handles blur events
    - Verify window hides when clicking outside (100ms delay already implemented)
    - Test with different scenarios: clicking desktop, switching apps, clicking menu bar
    - _Requirements: 2.5, 2.6_

  - [ ] 22.3 Auto-select search text on window open
    - Modify SearchInput component to select all text on focus
    - Use input.select() when window becomes visible
    - Ensure typing immediately replaces selected text
    - Test with keyboard shortcut and menu bar "Show" action
    - _Requirements: 7.2_

  - [ ] 22.4 Disable macOS autocomplete/grammar suggestions
    - Add autoComplete="off" to TextInput
    - Add autoCorrect="off" to TextInput
    - Add spellCheck={false} to TextInput
    - Add data-gramm="false" to disable Grammarly
    - Test that no autocomplete suggestions appear
    - _Requirements: 7.2, 12.4_

  - [ ]* 22.5 Write tests for search UX improvements
    - Test search text is selected on window open
    - Test typing replaces selected text
    - Test autocomplete attributes are set correctly
    - _Requirements: 17.4_

- [ ] 23. Final Integration and Testing
  - [ ] 23.1 Run all tests
    - Execute npm test for frontend tests
    - Execute cargo test for backend tests
    - Verify all property tests pass with 100 iterations
    - _Requirements: 17.1-17.9_

  - [ ] 23.2 Manual testing checklist
    - Test global shortcut (Cmd+Shift+K) shows/hides window
    - Test search filtering works correctly
    - Test ingress URL opening in browser
    - Test settings persistence across restarts
    - Test error handling when Kubernetes is unavailable
    - Test menu bar functionality
    - Test permissions dialogs
    - Test theme switching (light/dark/system)
    - Test search text auto-selection on window open
    - Test window auto-closes when clicking outside
    - Test no autocomplete suggestions in search field
    - _Requirements: All_

  - [ ] 23.3 Performance testing
    - Test with 1000+ ingresses
    - Verify window shows within 100ms
    - Verify search filtering within 150ms
    - Verify memory usage under 100MB
    - _Requirements: 16.1-16.8_

## Notes

- Tasks marked with `*` are optional testing tasks that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate component interactions
- Manual testing ensures end-to-end functionality
