# Implementation Plan: Kubernetes Ingress Desktop Search

## Overview

This implementation plan breaks down the development of the Tauri-based macOS desktop application into discrete, incremental tasks. Each task builds on previous work and includes testing to validate functionality early.

## Tasks

- [-] 1. Project Scaffolding and Initial Setup
  - Initialize Tauri project with React + TypeScript template
  - Configure Vite, TypeScript, Tailwind CSS, and Mantine UI
  - Set up project structure (src/, src-tauri/, tests/)
  - Configure Cargo.toml with required dependencies (kube, tokio, serde, tauri plugins)
  - Configure tauri.conf.json with window settings (frameless, transparent, alwaysOnTop, skipTaskbar, hidden)
  - Create README with project description and setup instructions
  - _Requirements: 14.1, 14.2, 14.6, 14.7_

- [ ] 2. TypeScript Type Definitions
  - Create src/types/ingress.ts with IngressData, ErrorInfo, Settings, IngressResponse interfaces
  - Ensure types match the Kubernetes ingress structure documented in requirements
  - _Requirements: 5.1, 15.1-15.10_

- [ ] 3. Rust Data Models and State Management
  - [ ] 3.1 Create src-tauri/src/state/app_state.rs with IngressData, ErrorInfo, AppState structs
    - Implement Clone, Serialize, Deserialize derives
    - Use Arc<RwLock<T>> for thread-safe state
    - _Requirements: 5.1, 13.5_

  - [ ]* 3.2 Write unit tests for state initialization
    - Test AppState::new() creates empty state
    - _Requirements: 17.1_

- [ ] 4. Kubernetes Client Implementation
  - [ ] 4.1 Create src-tauri/src/k8s/client.rs with K8sClient struct
    - Implement K8sClient::new() using kube::Config::infer()
    - Implement list_ingresses() using kube::Api<Ingress>
    - Handle kubeconfig loading errors gracefully
    - _Requirements: 4.1, 4.2, 4.3, 13.1, 13.7_

  - [ ]* 4.2 Write unit tests for K8sClient
    - Test kubeconfig loading with valid config
    - Test error handling for missing kubeconfig
    - _Requirements: 17.1_

- [ ] 5. Ingress Transformation Logic
  - [ ] 5.1 Create src-tauri/src/k8s/transform.rs with transform_ingress function
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

- [ ] 6. Background Refresh Task
  - [ ] 6.1 Create src-tauri/src/refresh/task.rs with start_refresh_task function
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

- [ ] 7. Tauri Commands
  - [ ] 7.1 Create src-tauri/src/commands/ingresses.rs
    - Implement get_ingresses command (returns IngressResponse)
    - Implement open_url command (uses tauri-plugin-shell)
    - _Requirements: 7.1-7.4, 8.1-8.4, 13.4_

  - [ ] 7.2 Create src-tauri/src/commands/settings.rs
    - Implement get_settings command
    - Implement update_settings command with validation
    - Validate refresh interval (10-3600 seconds)
    - _Requirements: 9.1-9.20, 13.4_

  - [ ] 7.3 Create src-tauri/src/commands/kubernetes.rs
    - Implement get_contexts command
    - Implement switch_context command
    - _Requirements: 4.6, 4.7, 9.15-9.17, 13.4_

  - [ ]* 7.4 Write integration tests for Tauri commands
    - Test get_ingresses returns cached data
    - Test update_settings validates and persists
    - Test switch_context changes active cluster
    - _Requirements: 17.3_

- [ ] 8. Settings Persistence
  - [ ] 8.1 Create src-tauri/src/settings/store.rs
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

- [ ] 9. Error Handling
  - [ ] 9.1 Create src-tauri/src/error.rs with AppError enum
    - Define KubernetesError, SettingsError, PermissionError, SystemError variants
    - Implement From<AppError> for String
    - _Requirements: 11.1-11.9, 13.9_

  - [ ]* 9.2 Write property test for error resilience
    - **Property 5: Error Resilience**
    - **Validates: Requirements 11.7**
    - Simulate various errors
    - Verify application continues running
    - _Requirements: 17.2_

- [ ] 10. Main Rust Entry Point
  - [ ] 10.1 Implement src-tauri/src/main.rs
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

- [ ] 11. Frontend: SearchInput Component
  - [ ] 11.1 Create src/components/SearchInput.tsx
    - Use Mantine TextInput with IconSearch
    - Implement auto-focus
    - Use useDebouncedValue hook (150ms)
    - _Requirements: 7.2, 7.4, 12.4_

  - [ ]* 11.2 Write component tests for SearchInput
    - Test auto-focus on mount
    - Test debouncing behavior
    - _Requirements: 17.4_

- [ ] 12. Frontend: IngressList and IngressItem Components
  - [ ] 12.1 Create src/components/IngressList.tsx
    - Use Mantine Stack for layout
    - Display first 50 ingresses with "X more results" message
    - Show "No ingresses found" when empty
    - _Requirements: 7.5, 7.10, 12.5_

  - [ ] 12.2 Create src/components/IngressItem.tsx
    - Display name, namespace, hosts, TLS badge
    - Implement expandable URL list
    - Call open_url Tauri command on URL click
    - _Requirements: 7.5, 7.6, 8.1-8.4, 12.6_

  - [ ]* 12.3 Write component tests for IngressList and IngressItem
    - Test ingress display with all required fields
    - Test "No ingresses found" message
    - Test URL click calls open_url
    - _Requirements: 17.4_

- [ ] 13. Frontend: ErrorBanner Component
  - [ ] 13.1 Create src/components/ErrorBanner.tsx
    - Use Mantine Alert with error color
    - Display error message and timestamp
    - Implement "Copy Error" button using navigator.clipboard
    - _Requirements: 7.9, 12.7_

  - [ ]* 13.2 Write component tests for ErrorBanner
    - Test error message display
    - Test copy button functionality
    - _Requirements: 17.4_

- [ ] 14. Frontend: SettingsDialog Component
  - [ ] 14.1 Create src/components/SettingsDialog.tsx
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

- [ ] 15. Frontend: Custom Hooks
  - [ ] 15.1 Create src/hooks/useIngresses.ts
    - Call get_ingresses Tauri command
    - Listen for "ingresses-updated" events
    - Return ingresses, loading, error, lastUpdated
    - _Requirements: 6.1-6.11_

  - [ ] 15.2 Create src/hooks/useSearch.ts
    - Implement filtering logic (name, namespace, host, URL)
    - Use useMemo for performance
    - _Requirements: 7.3_

  - [ ]* 15.3 Write property test for search filtering
    - **Property 2: Search Filtering Correctness**
    - **Validates: Requirements 7.3**
    - Generate random ingress lists and search terms
    - Verify filtering returns only matching ingresses
    - _Requirements: 17.2_

- [ ] 16. Frontend: Main App Component
  - [ ] 16.1 Create src/App.tsx
    - Use Mantine Stack for layout
    - Integrate SearchInput, IngressList, ErrorBanner, SettingsDialog
    - Use useIngresses and useSearch hooks
    - Apply semi-transparent dark background (rgba(0, 0, 0, 0.7))
    - _Requirements: 7.1-7.10, 12.10_

  - [ ] 16.2 Create src/main.tsx
    - Setup React root
    - Wrap App with MantineProvider
    - _Requirements: 12.1_

  - [ ] 16.3 Create src/styles/index.css
    - Configure Tailwind CSS
    - Add custom styles for vibrancy background
    - Add rounded corners (12px border-radius)
    - _Requirements: 1.9, 12.3_

- [ ] 17. macOS Permissions Handling
  - [ ] 17.1 Implement accessibility permission check
    - Check for accessibility permission on shortcut registration
    - Display dialog with explanation and "Open System Settings" button
    - _Requirements: 10.1-10.3_

  - [ ] 17.2 Implement autostart permission handling
    - Use tauri-plugin-autostart for login item registration
    - Handle registration failures gracefully
    - _Requirements: 10.4-10.5_

  - [ ]* 17.3 Write integration tests for permissions
    - Test permission check on startup
    - Test graceful degradation without permissions
    - _Requirements: 17.3_

- [ ] 18. Window Behavior and Focus Management
  - [ ] 18.1 Implement window show/hide logic
    - Hide window on Escape key press
    - Hide window on focus loss (100ms delay)
    - Center window on show
    - _Requirements: 2.4, 2.5, 2.6_

  - [ ] 18.2 Implement keyboard navigation
    - Arrow Up/Down to navigate ingress list
    - Enter to select ingress
    - Escape to close window
    - _Requirements: 8.5, 11.4_

- [ ] 19. Build Configuration and Icons
  - [ ] 19.1 Create application icon
    - Design 1024x1024 PNG icon
    - Place in src-tauri/icons/icon.png
    - _Requirements: 14.4_

  - [ ] 19.2 Configure Info.plist
    - Set LSUIElement to true
    - Configure bundle identifier
    - _Requirements: 14.3_

  - [ ] 19.3 Test build process
    - Run npm run tauri build
    - Verify .app bundle is created
    - Test application launches and functions correctly
    - _Requirements: 14.2_

- [ ] 20. Documentation
  - [ ] 20.1 Write comprehensive README
    - Project description
    - Prerequisites (Rust, Node.js, kubeconfig)
    - Installation instructions
    - Build instructions (dev and production)
    - Usage instructions (keyboard shortcuts, settings)
    - Troubleshooting section
    - _Requirements: 14.7_

  - [ ] 20.2 Add LICENSE file
    - Copy GPL-3.0 license
    - _Requirements: 14.8_

  - [ ] 20.3 Add inline code documentation
    - Document all public functions and structs
    - Add JSDoc comments to TypeScript code
    - _Requirements: 14.7_

- [ ] 21. Final Integration and Testing
  - [ ] 21.1 Run all tests
    - Execute npm test for frontend tests
    - Execute cargo test for backend tests
    - Verify all property tests pass with 100 iterations
    - _Requirements: 17.1-17.9_

  - [ ] 21.2 Manual testing checklist
    - Test global shortcut (Cmd+Shift+K) shows/hides window
    - Test search filtering works correctly
    - Test ingress URL opening in browser
    - Test settings persistence across restarts
    - Test error handling when Kubernetes is unavailable
    - Test menu bar functionality
    - Test permissions dialogs
    - _Requirements: All_

  - [ ] 21.3 Performance testing
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
