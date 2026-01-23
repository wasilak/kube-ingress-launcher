/**
 * Main App component for Kube Ingress Launcher
 * 
 * This component orchestrates the entire UI:
 * - SearchInput for filtering ingresses
 * - IngressList for displaying results
 * - ErrorBanner for showing errors
 * - SettingsDialog for configuration
 * - Statistics page routing for statistics window
 * 
 * Requirements: 7.1-7.10, 12.10, 15.3, 17.1-17.12
 */

import { useState, useEffect } from 'react';
import { Stack, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Burger } from '@mantine/core';
import { SearchInput } from './components/SearchInput';
import { IngressList } from './components/IngressList';
import { ErrorBanner } from './components/ErrorBanner';
import { SettingsDialog } from './components/SettingsDialog';
import { StatisticsDialog } from './components/StatisticsDialog';
import { NavigationDrawer } from './components/NavigationDrawer';
import { Statistics } from './pages/Statistics';
import { useIngresses } from './hooks/useIngresses';
import { useSearch } from './hooks/useSearch';
import { useWindowBehavior } from './hooks/useWindowBehavior';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useTheme } from './hooks/useTheme';
import { IngressData } from './types/ingress';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';

/**
 * Main application component
 * 
 * Features:
 * - Detects which window is active (main or statistics)
 * - Renders appropriate content based on window label
 * - Fetches and displays Kubernetes ingress resources (main window)
 * - Provides search/filter functionality (main window)
 * - Shows error messages when issues occur (main window)
 * - Allows configuration via settings dialog (main window)
 * - Displays usage statistics (statistics window)
 * - Semi-transparent background for vibrancy effect
 * - Theme management (light/dark/system) via ThemeProvider
 * 
 * Requirements: 7.1-7.10, 12.10, 15.3, 17.1-17.12
 */
export function App() {
  // Initialize theme (loads from settings and manages Mantine color scheme)
  useTheme();
  
  // Detect which window we're in
  const [windowLabel, setWindowLabel] = useState<string>('');

  useEffect(() => {
    const detectWindow = async () => {
      const window = getCurrentWindow();
      const label = window.label;
      setWindowLabel(label);
    };
    
    detectWindow();
  }, []);

  // If we're in the statistics window, render the Statistics page
  if (windowLabel === 'statistics') {
    return <Statistics />;
  }

  // Otherwise, render the main search window
  return <MainWindow />;
}

/**
 * Main search window component
 * 
 * Features:
 * - Fetches and displays Kubernetes ingress resources
 * - Provides search/filter functionality
 * - Shows error messages when issues occur
 * - Allows configuration via settings dialog
 * 
 * Requirements: 7.1-7.10, 12.10, 17.1-17.12
 */
function MainWindow() {
  
  // Fetch ingresses data and manage loading/error states
  const { ingresses, loading, error, refresh } = useIngresses();
  
  // Search/filter functionality
  const { searchTerm, setSearchTerm, filteredIngresses } = useSearch(ingresses);
  
  // Window behavior (Escape key, focus loss)
  useWindowBehavior();
  
  // Settings dialog state
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Statistics dialog state
  const [statisticsOpen, setStatisticsOpen] = useState(false);
  
  // Navigation drawer state
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

  // Listen for settings dialog open event from menu
  useEffect(() => {
    const unlisten = listen('open-settings', () => {
      setSettingsOpen(true);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);
  
  // Listen for statistics dialog open event from menu
  useEffect(() => {
    const unlisten = listen('open-statistics', () => {
      setStatisticsOpen(true);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  /**
   * Handle ingress selection
   * Opens the first URL of the selected ingress in the default browser
   * 
   * Requirements: 8.1-8.4
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
  
  /**
   * Handle navigation from drawer
   */
  const handleNavigate = (destination: 'search' | 'statistics' | 'settings') => {
    switch (destination) {
      case 'search':
        // Already on search view, just close drawer
        break;
      case 'statistics':
        setStatisticsOpen(true);
        break;
      case 'settings':
        setSettingsOpen(true);
        break;
    }
  };

  // Keyboard navigation for ingress list
  const { selectedIndex } = useKeyboardNavigation({
    items: filteredIngresses,
    onSelect: handleIngressSelect,
    enabled: !settingsOpen && !statisticsOpen && !drawerOpened, // Disable when dialogs/drawer are open
  });

  return (
    <div className="app-container" data-tauri-drag-region>
      <Stack gap="md" p="md">
        {/* Error banner - shown when there's an error */}
        {error && <ErrorBanner error={error} />}
        
        {/* Search input and burger menu on same line */}
        <Group gap="sm" className="no-drag" align="center">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            loading={loading}
          />
          <Burger
            opened={drawerOpened}
            onClick={openDrawer}
            size="sm"
            aria-label="Open navigation menu"
          />
        </Group>
        
        {/* Ingress list - displays filtered results */}
        <div className="no-drag">
          <IngressList
            ingresses={filteredIngresses}
            onSelect={handleIngressSelect}
            selectedIndex={selectedIndex}
            onRefresh={refresh}
            loading={loading}
            searchTerm={searchTerm}
          />
        </div>
      </Stack>

      {/* Navigation drawer */}
      <NavigationDrawer
        opened={drawerOpened}
        onClose={closeDrawer}
        onNavigate={handleNavigate}
      />

      {/* Settings dialog - modal for configuration */}
      <SettingsDialog
        opened={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      
      {/* Statistics dialog - modal for usage statistics */}
      <StatisticsDialog
        opened={statisticsOpen}
        onClose={() => setStatisticsOpen(false)}
      />
    </div>
  );
}

export default App;
