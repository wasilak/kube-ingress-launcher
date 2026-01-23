/**
 * SearchView component - Main search interface for Kubernetes ingress resources
 * 
 * This component provides the search functionality:
 * - SearchInput for filtering ingresses
 * - IngressList for displaying results
 * - ErrorBanner for showing errors
 * - Keyboard navigation for ingress selection
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { Stack, ScrollArea, Container } from '@mantine/core';
import { SearchInput } from '../components/SearchInput';
import { IngressList } from '../components/IngressList';
import { ErrorBanner } from '../components/ErrorBanner';
import { useIngresses } from '../hooks/useIngresses';
import { useSearch } from '../hooks/useSearch';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useWindowBehavior } from '../hooks/useWindowBehavior';
import { IngressData } from '../types/ingress';
import { invoke } from '@tauri-apps/api/core';

/**
 * SearchView component displays the search interface
 * 
 * Features:
 * - Fetches and displays Kubernetes ingress resources
 * - Provides search/filter functionality
 * - Shows error messages when issues occur
 * - Keyboard navigation for ingress list
 * - Opens selected ingress URLs in default browser
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
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
   * 
   * Requirements: 4.5
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
    <ScrollArea h="calc(100vh - 60px)" scrollbarSize={8} scrollbars="y">
      <Container size="lg" px="md">
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
      </Container>
    </ScrollArea>
  );
}
