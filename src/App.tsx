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
import { Stack } from '@mantine/core';
import { SearchInput } from './components/SearchInput';
import { IngressList } from './components/IngressList';
import { ErrorBanner } from './components/ErrorBanner';
import { SettingsDialog } from './components/SettingsDialog';
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

  // Listen for settings dialog open event from menu
  useEffect(() => {
    const unlisten = listen('open-settings', () => {
      setSettingsOpen(true);
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

  // Keyboard navigation for ingress list
  const { selectedIndex } = useKeyboardNavigation({
    items: filteredIngresses,
    onSelect: handleIngressSelect,
    enabled: !settingsOpen, // Disable when settings dialog is open
  });

  return (
    <div className="app-container" data-tauri-drag-region>
      <Stack gap="md" p="md">
        {/* Error banner - shown when there's an error */}
        {error && <ErrorBanner error={error} />}
        
        {/* Search input - auto-focused for immediate typing */}
        <div className="no-drag">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            loading={loading}
          />
        </div>
        
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

      {/* Settings dialog - modal for configuration */}
      <SettingsDialog
        opened={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
