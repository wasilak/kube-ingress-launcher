/**
 * Main App component for Kube Ingress Desktop
 * 
 * This component orchestrates the entire UI:
 * - SearchInput for filtering ingresses
 * - IngressList for displaying results
 * - ErrorBanner for showing errors
 * - SettingsDialog for configuration
 * 
 * Requirements: 7.1-7.10, 12.10
 */

import { useState } from 'react';
import { Stack } from '@mantine/core';
import { SearchInput } from './components/SearchInput';
import { IngressList } from './components/IngressList';
import { ErrorBanner } from './components/ErrorBanner';
import { SettingsDialog } from './components/SettingsDialog';
import { useIngresses } from './hooks/useIngresses';
import { useSearch } from './hooks/useSearch';
import { useWindowBehavior } from './hooks/useWindowBehavior';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { IngressData } from './types/ingress';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';

/**
 * Main application component
 * 
 * Features:
 * - Fetches and displays Kubernetes ingress resources
 * - Provides search/filter functionality
 * - Shows error messages when issues occur
 * - Allows configuration via settings dialog
 * - Semi-transparent dark background for vibrancy effect
 * 
 * Requirements: 7.1-7.10, 12.10
 */
export function App() {
  // Fetch ingresses data and manage loading/error states
  const { ingresses, loading, error } = useIngresses();
  
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
    <div className="app-container">
      <Stack gap="md" p="md">
        {/* Error banner - shown when there's an error */}
        {error && <ErrorBanner error={error} />}
        
        {/* Search input - auto-focused for immediate typing */}
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
        />
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
