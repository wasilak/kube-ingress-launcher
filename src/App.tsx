/**
 * Main App component for Kube Ingress Launcher
 * 
 * This component orchestrates the entire UI:
 * - SearchInput for filtering ingresses
 * - IngressList for displaying results
 * - ErrorBanner for showing errors
 * - SettingsDialog for configuration
 * - Theme management with useTheme hook
 * 
 * Requirements: 7.1-7.10, 12.10, 17.1-17.12
 */

import { useState } from 'react';
import { Stack, MantineProvider, createTheme } from '@mantine/core';
import { SearchInput } from './components/SearchInput';
import { IngressList } from './components/IngressList';
import { ErrorBanner } from './components/ErrorBanner';
import { SettingsDialog } from './components/SettingsDialog';
import { useIngresses } from './hooks/useIngresses';
import { useSearch } from './hooks/useSearch';
import { useWindowBehavior } from './hooks/useWindowBehavior';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useTheme } from './hooks/useTheme';
import { IngressData } from './types/ingress';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';

/**
 * Mantine theme configuration
 */
const theme = createTheme({
  defaultRadius: 'md',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
});

/**
 * Main application component
 * 
 * Features:
 * - Fetches and displays Kubernetes ingress resources
 * - Provides search/filter functionality
 * - Shows error messages when issues occur
 * - Allows configuration via settings dialog
 * - Semi-transparent dark background for vibrancy effect
 * - Theme management (light/dark/system)
 * 
 * Requirements: 7.1-7.10, 12.10, 17.1-17.12
 */
export function App() {
  // Theme management
  const { colorScheme } = useTheme();
  
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
    <MantineProvider theme={theme} forceColorScheme={colorScheme}>
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
            />
          </div>
        </Stack>

        {/* Settings dialog - modal for configuration */}
        <SettingsDialog
          opened={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    </MantineProvider>
  );
}

export default App;
