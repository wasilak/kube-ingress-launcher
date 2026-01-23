# Implementation Plan: React Router Migration

## Overview

This implementation plan outlines the tasks for migrating the Kube Ingress Launcher application from modal-based navigation to React Router-based navigation. The migration will be performed incrementally, ensuring the application remains functional at each step.

## Tasks

- [x] 1. Install and configure React Router
  - Install react-router-dom package (v7 or later)
  - Configure BrowserRouter in main.tsx
  - Verify build succeeds with new dependency
  - _Requirements: 1.1, 1.2_

- [x] 2. Create Layout component with burger menu
  - [x] 2.1 Create Layout component (src/components/Layout.tsx)
    - Implement Layout with Outlet for nested routes
    - Add burger menu button visible on all routes
    - Integrate NavigationDrawer with current path tracking
    - _Requirements: 3.1, 3.2_
  
  - [ ]* 2.2 Write unit tests for Layout component
    - Test that Layout renders burger menu
    - Test that Layout renders Outlet
    - Test that burger menu opens drawer
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Create view components for routes
  - [x] 3.1 Create SearchView component (src/views/SearchView.tsx)
    - Extract search functionality from MainWindow
    - Include SearchInput, IngressList, ErrorBanner
    - Maintain all existing search functionality
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 3.2 Create StatisticsView wrapper (src/views/StatisticsView.tsx)
    - Create thin wrapper around existing StatisticsView component
    - Remove modal wrapper, keep content
    - _Requirements: 5.1, 5.2_
  
  - [x] 3.3 Create SettingsView component (src/views/SettingsView.tsx)
    - Extract settings content from SettingsDialog
    - Remove Modal wrapper, keep all functionality
    - Preserve functional modals (PermissionsDialog)
    - _Requirements: 6.1, 6.2, 6.5_
  
  - [ ]* 3.4 Write unit tests for view components
    - Test SearchView renders all components
    - Test StatisticsView renders statistics content
    - Test SettingsView renders settings fields
    - _Requirements: 4.2, 4.3, 5.2, 6.2_

- [x] 4. Update App.tsx with route configuration
  - [x] 4.1 Configure Routes with nested structure
    - Define root route with Layout
    - Define index route for SearchView
    - Define /statistics route for StatisticsView
    - Define /settings route for SettingsView
    - Add catch-all route for invalid paths
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 4.2 Add navigation event listener
    - Listen for "navigate" events from backend
    - Use useNavigate to handle navigation
    - Add error handling for navigation failures
    - _Requirements: 9.4_
  
  - [ ]* 4.3 Write property test for route rendering
    - **Property 1: Route Rendering Correctness**
    - **Validates: Requirements 2.4**
    - Test that any valid route renders correct component
    - _Requirements: 2.4_
  
  - [ ]* 4.4 Write property test for invalid route redirect
    - **Property 2: Invalid Route Redirect**
    - **Validates: Requirements 2.5**
    - Test that any invalid route redirects to home
    - _Requirements: 2.5_

- [x] 5. Update NavigationDrawer for React Router
  - [x] 5.1 Update NavigationDrawer to use React Router links
    - Use Mantine NavLink with React Router NavLink component
    - Add currentPath prop for active state
    - Update navigation items to use "to" prop
    - Close drawer after navigation
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 5.2 Write property test for navigation link behavior
    - **Property 6: Navigation Link Behavior**
    - **Validates: Requirements 3.5, 7.3, 7.5**
    - Test that any navigation link navigates and closes drawer
    - _Requirements: 3.5, 7.3, 7.5_
  
  - [ ]* 5.3 Write property test for active route highlighting
    - **Property 9: Active Route Highlighting**
    - **Validates: Requirements 7.4**
    - Test that any active route is highlighted in drawer
    - _Requirements: 7.4_

- [x] 6. Update backend menu event emissions
  - [x] 6.1 Update Rust menu handlers (src-tauri/src/menu.rs)
    - Replace "open-settings" event with "navigate" event
    - Replace "open-statistics" event with "navigate" event
    - Emit route paths ("/settings", "/statistics")
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [ ]* 6.2 Write integration test for menu navigation
    - Test that menu events trigger navigation
    - Test that navigation events contain correct routes
    - _Requirements: 9.3, 9.4_

- [x] 7. Remove modal components and state
  - [x] 7.1 Remove SettingsDialog component
    - Delete src/components/SettingsDialog.tsx
    - Remove imports from App.tsx
    - _Requirements: 8.1_
  
  - [x] 7.2 Remove StatisticsDialog component
    - Delete src/components/StatisticsDialog.tsx
    - Remove imports from App.tsx
    - _Requirements: 8.2_
  
  - [x] 7.3 Remove modal state from App.tsx
    - Remove settingsOpen state
    - Remove statisticsOpen state
    - Remove event listeners for "open-settings" and "open-statistics"
    - _Requirements: 8.3, 9.1, 9.2_
  
  - [x] 7.4 Remove window detection logic
    - Remove windowLabel state
    - Remove detectWindow effect
    - Remove Statistics page conditional rendering
    - _Requirements: 8.4_
  
  - [x] 7.5 Remove separate statistics window configuration
    - Update tauri.conf.json to remove statistics window
    - _Requirements: 8.5_

- [ ] 8. Update keyboard navigation for routes
  - [ ] 8.1 Update useKeyboardNavigation hook
    - Add route-aware enabled logic
    - Enable only on search route
    - Disable on statistics and settings routes
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ]* 8.2 Write unit tests for keyboard navigation
    - Test keyboard navigation enabled on search route
    - Test keyboard navigation disabled on other routes
    - Test Escape key closes drawer
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [ ]* 8.3 Write property test for keyboard shortcuts preservation
    - **Property 10: Keyboard Shortcuts Preservation**
    - **Validates: Requirements 10.5**
    - Test that any existing keyboard shortcut still works
    - _Requirements: 10.5_

- [ ] 9. Implement error boundary for routes
  - [ ] 9.1 Create RouteErrorBoundary component
    - Implement error boundary class component
    - Display error message with return to home button
    - Log errors to console
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  
  - [ ] 9.2 Wrap Routes with error boundary
    - Add RouteErrorBoundary in App.tsx
    - Ensure all routes are protected
    - _Requirements: 14.1, 14.5_
  
  - [ ]* 9.3 Write unit tests for error boundary
    - Test that error boundary catches rendering errors
    - Test that error message is displayed
    - Test that return to home button works
    - _Requirements: 14.1, 14.2, 14.3_

- [ ] 10. Add route transitions
  - [ ] 10.1 Configure fade transitions for routes
    - Use Mantine's transition system
    - Set transition duration to 200ms
    - Apply to route changes
    - _Requirements: 15.1, 15.2, 15.3_
  
  - [ ]* 10.2 Write property test for transitions
    - **Property 16: Fade Transitions on Navigation**
    - **Validates: Requirements 15.1**
    - Test that any route transition applies fade effect
    - _Requirements: 15.1_
  
  - [ ]* 10.3 Write property test for transition functionality
    - **Property 17: Transitions Don't Interfere with Functionality**
    - **Validates: Requirements 15.4**
    - Test that navigation works during transitions
    - _Requirements: 15.4_

- [ ] 11. Verify theme consistency across routes
  - [ ]* 11.1 Write property test for theme persistence
    - **Property 11: Theme Persistence Across Navigation**
    - **Validates: Requirements 11.1, 11.4**
    - Test that any theme persists across route changes
    - _Requirements: 11.1, 11.4_
  
  - [ ]* 11.2 Write property test for theme application
    - **Property 12: Theme Applies to All Routes**
    - **Validates: Requirements 11.2**
    - Test that any route has theme applied
    - _Requirements: 11.2_
  
  - [ ]* 11.3 Write integration test for theme changes
    - Test that changing theme in settings updates all routes
    - _Requirements: 11.3_

- [ ] 12. Verify URL state management
  - [ ]* 12.1 Write property test for URL updates
    - **Property 13: URL Updates on Navigation**
    - **Validates: Requirements 12.1**
    - Test that any navigation updates browser URL
    - _Requirements: 12.1_
  
  - [ ]* 12.2 Write integration tests for browser navigation
    - Test browser back button navigates to previous route
    - Test browser forward button navigates to next route
    - _Requirements: 12.2, 12.3_
  
  - [ ]* 12.3 Write property test for deep linking
    - **Property 14: Deep Linking Support**
    - **Validates: Requirements 12.4**
    - Test that any route can be accessed directly via URL
    - _Requirements: 12.4_
  
  - [ ]* 12.4 Write integration test for route persistence
    - Test that app navigates to last accessed route on startup
    - _Requirements: 12.5_

- [ ] 13. Verify functionality preservation
  - [ ]* 13.1 Write property test for search functionality
    - **Property 7: Search Functionality Preservation**
    - **Validates: Requirements 4.5**
    - Test that search filtering works as before
    - _Requirements: 4.5_
  
  - [ ]* 13.2 Write property test for settings functionality
    - **Property 8: Settings Functionality Preservation**
    - **Validates: Requirements 6.5**
    - Test that settings persist across navigation
    - _Requirements: 6.5_
  
  - [ ]* 13.3 Write integration test for functional modals
    - Test that PermissionsDialog still works
    - Test that ClearConfirmationModal still works
    - Test that AreaChartModal still works
    - _Requirements: 8.6_

- [ ] 14. Verify Mantine integration
  - [ ]* 14.1 Write property test for Mantine styling
    - **Property 15: Mantine Styling with Routing**
    - **Validates: Requirements 13.4**
    - Test that Mantine components maintain styling on all routes
    - _Requirements: 13.4_
  
  - [ ]* 14.2 Write integration test for Mantine navigation
    - Test that Mantine NavLink components navigate correctly
    - _Requirements: 13.1, 13.2_

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property tests and verify they pass
  - Run all integration tests and verify they pass
  - Verify build succeeds without errors or warnings
  - Test application in development mode
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- The migration preserves all existing functionality while improving navigation architecture
- Functional modals (PermissionsDialog, ClearConfirmationModal, AreaChartModal) are kept as they represent actions, not navigation
