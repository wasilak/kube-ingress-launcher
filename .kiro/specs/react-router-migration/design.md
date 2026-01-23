# Design Document: React Router Migration

## Overview

This design document outlines the technical approach for migrating the Kube Ingress Launcher application from modal-based navigation to React Router-based navigation. The migration will replace navigation modals (SettingsDialog, StatisticsDialog) with proper routes while preserving functional modals (PermissionsDialog, ClearConfirmationModal, AreaChartModal) that represent specific actions rather than navigation destinations.

The design leverages React Router v7's modern routing patterns with nested routes and layouts, integrated with Mantine UI components for consistent styling and navigation patterns.

## Architecture

### Current Architecture

```
App.tsx
├── Window Detection (main vs statistics)
├── MainWindow Component
│   ├── SearchInput
│   ├── IngressList
│   ├── ErrorBanner
│   ├── NavigationDrawer (opens modals)
│   ├── SettingsDialog (modal)
│   └── StatisticsDialog (modal)
└── Statistics Page (separate window)
```

### Target Architecture

```
App.tsx (Router Setup)
└── BrowserRouter
    └── Routes
        ├── Layout (with burger menu)
        │   ├── Route "/" → SearchView
        │   ├── Route "/statistics" → StatisticsView
        │   └── Route "/settings" → SettingsView
        └── Route "*" → Redirect to "/"
```

### Key Architectural Changes

1. **Single Window Application**: Remove separate statistics window, use routes instead
2. **Layout Component**: Shared layout with burger menu across all routes
3. **Route-Based Navigation**: Replace modal state with URL-based navigation
4. **Preserved Modals**: Keep functional modals (PermissionsDialog, etc.) as they represent actions, not navigation

## Components and Interfaces

### 1. Router Configuration (main.tsx)

**Purpose**: Configure React Router with BrowserRouter and route definitions

**Implementation**:
```typescript
// main.tsx
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MantineProvider>
  </React.StrictMode>
);
```

**Rationale**: BrowserRouter provides HTML5 history API-based routing, suitable for desktop applications. Wrapping at the root level ensures routing context is available throughout the app.

### 2. App Component with Routes (App.tsx)

**Purpose**: Define route structure and render appropriate components

**Implementation**:
```typescript
// App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SearchView } from './views/SearchView';
import { StatisticsView } from './views/StatisticsView';
import { SettingsView } from './views/SettingsView';

export function App() {
  // Initialize theme (loads from settings and manages Mantine color scheme)
  useTheme();
  
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<SearchView />} />
        <Route path="statistics" element={<StatisticsView />} />
        <Route path="settings" element={<SettingsView />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

**Interface**:
- No props (root component)
- Uses nested routes with Layout as parent
- Catch-all route redirects to home

**Rationale**: Nested routes allow Layout to wrap all views, providing consistent navigation. Index route serves as the default view at "/".

### 3. Layout Component (components/Layout.tsx)

**Purpose**: Provide consistent layout with burger menu across all routes

**Implementation**:
```typescript
// components/Layout.tsx
import { Outlet, useLocation } from 'react-router-dom';
import { Stack, Group, Burger } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { NavigationDrawer } from './NavigationDrawer';

export function Layout() {
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const location = useLocation();
  
  // Determine if we're on the search view to show search-specific UI
  const isSearchView = location.pathname === '/';
  
  return (
    <div className="app-container" data-tauri-drag-region>
      <Stack gap="md" p="md">
        {/* Burger menu - shown on all views */}
        <Group gap="sm" className="no-drag" align="center" justify="flex-end">
          <Burger
            opened={drawerOpened}
            onClick={openDrawer}
            size="sm"
            aria-label="Open navigation menu"
          />
        </Group>
        
        {/* Route content */}
        <div className="no-drag">
          <Outlet />
        </div>
      </Stack>

      {/* Navigation drawer */}
      <NavigationDrawer
        opened={drawerOpened}
        onClose={closeDrawer}
        currentPath={location.pathname}
      />
    </div>
  );
}
```

**Interface**:
```typescript
interface LayoutProps {
  // No props - uses Outlet for nested routes
}
```

**Rationale**: Layout provides consistent structure across all views. Outlet renders the matched child route. Burger menu is always visible for easy navigation.

### 4. SearchView Component (views/SearchView.tsx)

**Purpose**: Display search interface with ingress list

**Implementation**:
```typescript
// views/SearchView.tsx
import { useState } from 'react';
import { Stack } from '@mantine/core';
import { SearchInput } from '../components/SearchInput';
import { IngressList } from '../components/IngressList';
import { ErrorBanner } from '../components/ErrorBanner';
import { useIngresses } from '../hooks/useIngresses';
import { useSearch } from '../hooks/useSearch';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useWindowBehavior } from '../hooks/useWindowBehavior';
import { IngressData } from '../types/ingress';
import { invoke } from '@tauri-apps/api/core';

export function SearchView() {
  // Fetch ingresses data and manage loading/error states
  const { ingresses, loading, error, refresh } = useIngresses();
  
  // Search/filter functionality
  const { searchTerm, setSearchTerm, filteredIngresses } = useSearch(ingresses);
  
  // Window behavior (Escape key, focus loss)
  useWindowBehavior();

  /**
   * Handle ingress selection
   * Opens the first URL of the selected ingress in the default browser
   */
  const handleIngressSelect = async (ingress: IngressData) => {
    if (ingress.urls.length > 0) {
      try {
        await invoke('open_url', { url: ingress.urls[0] });
      } catch (err) {
        console.error('Failed to open URL:', err);
      }
    }
  };

  // Keyboard navigation for ingress list
  const { selectedIndex } = useKeyboardNavigation({
    items: filteredIngresses,
    onSelect: handleIngressSelect,
    enabled: true, // Always enabled on search view
  });

  return (
    <Stack gap="md">
      {/* Error banner - shown when there's an error */}
      {error && <ErrorBanner error={error} />}
      
      {/* Search input */}
      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        loading={loading}
      />
      
      {/* Ingress list - displays filtered results */}
      <IngressList
        ingresses={filteredIngresses}
        onSelect={handleIngressSelect}
        selectedIndex={selectedIndex}
        onRefresh={refresh}
        loading={loading}
        searchTerm={searchTerm}
      />
    </Stack>
  );
}
```

**Interface**:
```typescript
interface SearchViewProps {
  // No props - self-contained view
}
```

**Rationale**: Extracts search functionality from MainWindow into a dedicated view component. Maintains all existing functionality while being route-based.

### 5. StatisticsView Component (views/StatisticsView.tsx)

**Purpose**: Display usage statistics as a route

**Implementation**:
```typescript
// views/StatisticsView.tsx
import { StatisticsView as StatisticsContent } from '../components/StatisticsView';

export function StatisticsView() {
  return <StatisticsContent />;
}
```

**Interface**:
```typescript
interface StatisticsViewProps {
  // No props - wraps existing StatisticsView component
}
```

**Rationale**: Thin wrapper around existing StatisticsView component. Allows reuse of existing statistics logic while making it route-accessible.

### 6. SettingsView Component (views/SettingsView.tsx)

**Purpose**: Display settings interface as a route

**Implementation**:
```typescript
// views/SettingsView.tsx
import { Stack, NumberInput, Switch, Select, Text, Alert, Divider, Badge, Kbd, Group, Button, ScrollArea } from '@mantine/core';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Settings, VersionInfo } from '../types/ingress';
import { IconAlertCircle } from '@tabler/icons-react';
import { PermissionsDialog } from '../components/PermissionsDialog';
import { useTheme } from '../hooks/useTheme';

export function SettingsView() {
  // Theme management
  const { themeMode, changeTheme } = useTheme();
  
  const [settings, setSettings] = useState<Settings>({
    globalShortcut: 'CmdOrCtrl+Shift+K',
    refreshIntervalSecs: 60,
    autostart: false,
    kubeContext: '',
    theme: 'system',
  });
  
  const [contexts, setContexts] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [permissionType, setPermissionType] = useState<'accessibility' | 'autostart'>('accessibility');
  const [accessibilityGranted, setAccessibilityGranted] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  // Load settings and contexts on mount
  useEffect(() => {
    loadSettings();
    loadContexts();
    checkAccessibility();
    loadVersionInfo();
  }, []);

  // ... (rest of the implementation from SettingsDialog, without Modal wrapper)

  return (
    <ScrollArea.Autosize mah="calc(100vh - 100px)">
      <Stack gap="md">
        {/* All settings content from SettingsDialog */}
        {/* ... */}
      </Stack>
      
      {/* Permissions Dialog (functional modal - kept) */}
      <PermissionsDialog
        opened={permissionsDialogOpen}
        onClose={() => {
          setPermissionsDialogOpen(false);
          checkAccessibility();
        }}
        permissionType={permissionType}
      />
    </ScrollArea.Autosize>
  );
}
```

**Interface**:
```typescript
interface SettingsViewProps {
  // No props - self-contained view
}
```

**Rationale**: Extracts settings content from SettingsDialog modal into a route-based view. Removes Modal wrapper but keeps all functionality and functional modals (PermissionsDialog).

### 7. Updated NavigationDrawer Component (components/NavigationDrawer.tsx)

**Purpose**: Provide navigation using React Router links

**Implementation**:
```typescript
// components/NavigationDrawer.tsx
import { Drawer, Stack, NavLink } from '@mantine/core';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { IconSearch, IconChartBar, IconSettings } from '@tabler/icons-react';

interface NavigationDrawerProps {
  opened: boolean;
  onClose: () => void;
  currentPath: string;
}

export function NavigationDrawer({ opened, onClose, currentPath }: NavigationDrawerProps) {
  const navItems = [
    { to: '/', icon: IconSearch, label: 'Search', description: 'Search ingress resources' },
    { to: '/statistics', icon: IconChartBar, label: 'Statistics', description: 'View usage statistics' },
    { to: '/settings', icon: IconSettings, label: 'Options', description: 'Configure settings' },
  ];

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      title="Navigation"
      size="xs"
    >
      <Stack gap="xs">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            label={item.label}
            description={item.description}
            leftSection={<item.icon size={20} />}
            active={currentPath === item.to}
            component={RouterNavLink}
            to={item.to}
            onClick={onClose}
          />
        ))}
      </Stack>
    </Drawer>
  );
}
```

**Interface**:
```typescript
interface NavigationDrawerProps {
  opened: boolean;
  onClose: () => void;
  currentPath: string; // Current route path for active state
}
```

**Rationale**: Uses Mantine's NavLink with React Router's NavLink via component prop. Automatically highlights active route. Closes drawer after navigation.

### 8. Backend Navigation Events (src-tauri/src/menu.rs)

**Purpose**: Update menu event emissions to support routing

**Implementation**:
```rust
// src-tauri/src/menu.rs
use tauri::{AppHandle, Manager};

pub fn emit_navigate_event(app_handle: &AppHandle, route: &str) -> Result<(), String> {
    app_handle
        .emit("navigate", route)
        .map_err(|e| format!("Failed to emit navigate event: {}", e))
}

// Update menu item handlers
pub fn setup_menu_handlers(app_handle: &AppHandle) {
    // Settings menu item
    app_handle.on_menu_event(|app, event| {
        if event.id() == "settings" {
            let _ = emit_navigate_event(app, "/settings");
        }
    });
    
    // Statistics menu item
    app_handle.on_menu_event(|app, event| {
        if event.id() == "statistics" {
            let _ = emit_navigate_event(app, "/statistics");
        }
    });
}
```

**Interface**:
```rust
pub fn emit_navigate_event(app_handle: &AppHandle, route: &str) -> Result<(), String>
```

**Rationale**: Replaces specific "open-settings" and "open-statistics" events with a generic "navigate" event that carries the route path. More flexible and consistent with routing approach.

### 9. Frontend Navigation Event Listener (App.tsx)

**Purpose**: Listen for backend navigation events and navigate using React Router

**Implementation**:
```typescript
// App.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listen } from '@tauri-apps/api/event';

export function App() {
  const navigate = useNavigate();
  
  useTheme();
  
  // Listen for navigation events from backend (menu items)
  useEffect(() => {
    const unlisten = listen<string>('navigate', (event) => {
      navigate(event.payload);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [navigate]);
  
  return (
    <Routes>
      {/* ... routes ... */}
    </Routes>
  );
}
```

**Rationale**: Bridges backend menu actions with frontend routing. Allows menu items to trigger route navigation seamlessly.

## Data Models

### Route Configuration

```typescript
interface RouteConfig {
  path: string;
  element: React.ReactElement;
  children?: RouteConfig[];
}

const routes: RouteConfig[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: '', element: <SearchView /> },
      { path: 'statistics', element: <StatisticsView /> },
      { path: 'settings', element: <SettingsView /> },
    ],
  },
];
```

### Navigation Item

```typescript
interface NavigationItem {
  to: string;
  icon: React.ComponentType<{ size: number }>;
  label: string;
  description: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Route Rendering Correctness

*For any* valid route path (/, /statistics, /settings), when navigated to, the system should render the corresponding view component and that component should be present in the DOM.

**Validates: Requirements 2.4**

### Property 2: Invalid Route Redirect

*For any* invalid route path (not /, /statistics, or /settings), when accessed, the system should redirect to the root route "/" and render the SearchView component.

**Validates: Requirements 2.5**

### Property 3: Layout Wraps All Routes

*For any* valid route, when rendered, the Layout component should be present in the component tree wrapping the route's view component.

**Validates: Requirements 3.1**

### Property 4: Burger Menu Presence

*For any* route (/, /statistics, /settings), when rendered, a burger menu button should be visible in the UI.

**Validates: Requirements 3.2**

### Property 5: Burger Menu Opens Drawer

*For any* route, when the burger menu button is clicked, the navigation drawer should open and be visible.

**Validates: Requirements 3.3**

### Property 6: Navigation Link Behavior

*For any* navigation link in the drawer (Search, Statistics, Settings), when clicked, the system should navigate to the corresponding route and close the drawer.

**Validates: Requirements 3.5, 7.3, 7.5**

### Property 7: Search Functionality Preservation

*For any* search term entered in the SearchView, the ingress list should filter to show only ingresses matching the search term, maintaining the same filtering behavior as before the migration.

**Validates: Requirements 4.5**

### Property 8: Settings Functionality Preservation

*For any* settings field in the SettingsView, when modified, the setting should be saved and persist across navigation, maintaining the same behavior as before the migration.

**Validates: Requirements 6.5**

### Property 9: Active Route Highlighting

*For any* route (/, /statistics, /settings), when active, the corresponding navigation link in the drawer should be highlighted with active styling.

**Validates: Requirements 7.4**

### Property 10: Keyboard Shortcuts Preservation

*For any* existing keyboard shortcut (global shortcut, Escape key, arrow keys on search), the shortcut should continue to work with the same behavior as before the migration.

**Validates: Requirements 10.5**

### Property 11: Theme Persistence Across Navigation

*For any* theme setting (light, dark, auto), when navigating between routes, the theme should remain consistent and not reset.

**Validates: Requirements 11.1, 11.4**

### Property 12: Theme Applies to All Routes

*For any* route (/, /statistics, /settings), when rendered, the current theme setting should be applied to all UI components.

**Validates: Requirements 11.2**

### Property 13: URL Updates on Navigation

*For any* navigation action (link click, programmatic navigation, menu action), the browser URL should update to reflect the current route.

**Validates: Requirements 12.1**

### Property 14: Deep Linking Support

*For any* valid route path, when the application is opened directly to that URL, the corresponding view should render correctly without requiring navigation from the root.

**Validates: Requirements 12.4**

### Property 15: Mantine Styling with Routing

*For any* Mantine component used in the application, when rendered in any route, the component should maintain its proper styling and theming.

**Validates: Requirements 13.4**

### Property 16: Fade Transitions on Navigation

*For any* route transition, when navigating from one route to another, a fade transition should be applied with a duration of 200ms or less.

**Validates: Requirements 15.1**

### Property 17: Transitions Don't Interfere with Functionality

*For any* navigation action, when a transition is in progress, user interactions should still be processed correctly and not be blocked by the transition.

**Validates: Requirements 15.4**

## Error Handling

### Route Rendering Errors

**Error Boundary Implementation**:
```typescript
// components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Stack, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Route rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Stack gap="md" p="md">
          <Alert color="red" icon={<IconAlertCircle />} title="Something went wrong">
            <Text size="sm" mb="md">
              {this.state.error?.message || 'An unexpected error occurred while rendering this page.'}
            </Text>
            <Button component={Link} to="/" variant="light">
              Return to Home
            </Button>
          </Alert>
        </Stack>
      );
    }

    return this.props.children;
  }
}
```

**Usage**: Wrap Routes in App.tsx with RouteErrorBoundary to catch rendering errors in any route component.

### Invalid Route Handling

**Catch-All Route**: The `<Route path="*" element={<Navigate to="/" replace />} />` pattern ensures any invalid route redirects to the home page rather than showing a 404 error.

**Rationale**: Desktop applications should gracefully handle invalid routes by redirecting to a known-good state rather than showing error pages.

### Navigation Event Errors

**Error Handling in Event Listener**:
```typescript
useEffect(() => {
  const unlisten = listen<string>('navigate', (event) => {
    try {
      navigate(event.payload);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to home on navigation error
      navigate('/');
    }
  });

  return () => {
    unlisten.then((fn) => fn());
  };
}, [navigate]);
```

**Rationale**: Backend navigation events should be handled defensively to prevent navigation failures from breaking the application.

### Backend Event Emission Errors

**Error Handling in Rust**:
```rust
pub fn emit_navigate_event(app_handle: &AppHandle, route: &str) -> Result<(), String> {
    app_handle
        .emit("navigate", route)
        .map_err(|e| {
            eprintln!("Failed to emit navigate event: {}", e);
            format!("Failed to emit navigate event: {}", e)
        })
}
```

**Rationale**: Log errors when event emission fails but don't crash the application. Menu items should fail gracefully.

## Testing Strategy

### Unit Tests

**Component Tests**:
- Test that each view component (SearchView, StatisticsView, SettingsView) renders correctly
- Test that Layout component renders burger menu and Outlet
- Test that NavigationDrawer renders all navigation links
- Test that ErrorBoundary catches and displays errors

**Example Test**:
```typescript
// SearchView.test.tsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SearchView } from './SearchView';

describe('SearchView', () => {
  it('should render search input and ingress list', () => {
    render(
      <BrowserRouter>
        <SearchView />
      </BrowserRouter>
    );
    
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });
});
```

### Integration Tests

**Navigation Flow Tests**:
- Test that clicking navigation links navigates to correct routes
- Test that burger menu opens and closes drawer
- Test that browser back/forward buttons work correctly
- Test that menu events trigger navigation
- Test that invalid routes redirect to home

**Example Test**:
```typescript
// navigation.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';

describe('Navigation', () => {
  it('should navigate between routes', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Open drawer
    const burger = screen.getByLabelText(/open navigation menu/i);
    fireEvent.click(burger);
    
    // Click statistics link
    const statsLink = screen.getByText(/statistics/i);
    fireEvent.click(statsLink);
    
    // Verify navigation
    expect(window.location.pathname).toBe('/statistics');
    expect(screen.getByText(/usage statistics/i)).toBeInTheDocument();
  });
});
```

### Property-Based Tests

**Route Rendering Property Test**:
```typescript
// routes.property.test.tsx
import fc from 'fast-check';
import { render } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SearchView } from './views/SearchView';
import { StatisticsView } from './views/StatisticsView';
import { SettingsView } from './views/SettingsView';

// Feature: react-router-migration, Property 1: Route Rendering Correctness
describe('Route Rendering Property', () => {
  it('should render correct component for any valid route', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('/', '/statistics', '/settings'),
        (route) => {
          const { container } = render(
            <BrowserRouter initialEntries={[route]}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<SearchView />} />
                  <Route path="statistics" element={<StatisticsView />} />
                  <Route path="settings" element={<SettingsView />} />
                </Route>
              </Routes>
            </BrowserRouter>
          );
          
          // Verify component rendered
          expect(container.firstChild).toBeTruthy();
          
          // Verify Layout is present
          expect(container.querySelector('[data-tauri-drag-region]')).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Invalid Route Redirect Property Test**:
```typescript
// Feature: react-router-migration, Property 2: Invalid Route Redirect
describe('Invalid Route Redirect Property', () => {
  it('should redirect any invalid route to home', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !['/', '/statistics', '/settings'].includes(s)),
        (invalidRoute) => {
          const { container } = render(
            <BrowserRouter initialEntries={[invalidRoute]}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<SearchView />} />
                  <Route path="statistics" element={<StatisticsView />} />
                  <Route path="settings" element={<SettingsView />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          );
          
          // Should render SearchView (home)
          expect(container.querySelector('[data-testid="search-view"]')).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Manual Testing Checklist

**Navigation Testing**:
- [ ] Navigate to each route using navigation drawer
- [ ] Verify burger menu is visible on all routes
- [ ] Test browser back/forward buttons
- [ ] Test direct URL access to each route
- [ ] Test invalid URL redirects to home

**Functionality Preservation**:
- [ ] Verify search filtering works on SearchView
- [ ] Verify statistics display correctly on StatisticsView
- [ ] Verify settings can be changed on SettingsView
- [ ] Verify functional modals still work (PermissionsDialog, etc.)

**Theme Testing**:
- [ ] Change theme in settings
- [ ] Navigate between routes
- [ ] Verify theme persists across navigation
- [ ] Verify theme applies to all routes

**Keyboard Testing**:
- [ ] Test global shortcut still works
- [ ] Test Escape key closes drawer
- [ ] Test arrow keys work on search view
- [ ] Test arrow keys don't affect other views

**Menu Testing**:
- [ ] Click Settings menu item
- [ ] Verify navigation to /settings
- [ ] Click Statistics menu item
- [ ] Verify navigation to /statistics

### Test Configuration

**Jest Configuration** (jest.config.js):
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
  ],
};
```

**Test Dependencies**:
```json
{
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jest": "^30.0.0",
    "jest-environment-jsdom": "^30.0.0",
    "fast-check": "^3.0.0"
  }
}
```

### Coverage Goals

- **Unit Tests**: 80% coverage of view components and navigation logic
- **Integration Tests**: Cover all navigation flows and user interactions
- **Property Tests**: Minimum 100 iterations per property test
- **Manual Tests**: 100% of manual testing checklist must pass

