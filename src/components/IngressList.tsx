import { useMemo } from 'react';
import { Stack, Text, Button } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { IngressData } from '../types/ingress';
import { IngressItem } from './IngressItem';
import { ScrollArea } from '@mantine/core';
import { useUsageCounts } from '../hooks/useUsageCounts';

/**
 * Props for the IngressList component
 * 
 * Requirements: 7.5, 7.10, 12.5, 8.5, 11.4, 3.1, 3.2, 3.3, 3.4, 3.5
 */
interface IngressListProps {
  /** List of ingress resources to display */
  ingresses: IngressData[];
  
  /** Callback when an ingress is selected */
  onSelect: (ingress: IngressData) => void;
  
  /** Index of the currently selected item for keyboard navigation */
  selectedIndex?: number;
  
  /** Callback to manually refresh ingresses */
  onRefresh?: () => void;
  
  /** Whether a refresh is in progress */
  loading?: boolean;
  
  /** Current search term - used to determine if sorting should be applied */
  searchTerm?: string;
}

/**
 * IngressList component displays a list of Kubernetes ingress resources
 * 
 * Features:
 * - Displays first 50 ingresses for performance
 * - Shows "X more results" message when list is truncated
 * - Shows "No ingresses found" when list is empty with manual refresh button
 * - Uses Mantine Stack for vertical layout
 * - Scrollable container with max height
 * - Keyboard navigation support with visual selection
 * - Top 10 sorting: When search is empty, displays top 10 most-used ingresses first
 * 
 * Requirements: 7.5, 7.10, 12.5, 8.5, 11.4, 3.1, 3.2, 3.3, 3.4, 3.5
 */
export function IngressList({ 
  ingresses, 
  onSelect, 
  selectedIndex = -1, 
  onRefresh, 
  loading = false,
  searchTerm = ''
}: IngressListProps) {
  // Get usage counts for sorting
  const { counts } = useUsageCounts();
  
  // Sort ingresses by usage count when search is empty
  // When search is active, maintain filtered order
  const sortedIngresses = useMemo(() => {
    // If search term is not empty, return ingresses in current order (filtered by search)
    if (searchTerm.trim() !== '') {
      return ingresses;
    }
    
    // When search is empty, sort by usage count descending
    const sorted = [...ingresses].sort((a, b) => {
      const countA = a.hosts.length > 0 ? (counts[a.hosts[0]] || 0) : 0;
      const countB = b.hosts.length > 0 ? (counts[b.hosts[0]] || 0) : 0;
      return countB - countA; // Descending order
    });
    
    // Take top 10 and append the rest
    const top10 = sorted.slice(0, 10);
    const rest = sorted.slice(10);
    
    return [...top10, ...rest];
  }, [ingresses, searchTerm, counts]);
  
  // Show empty state when no ingresses
  if (sortedIngresses.length === 0) {
    return (
      <Stack align="center" py="xl" gap="md">
        <Text c="dimmed" ta="center">
          No ingresses found
        </Text>
        {onRefresh && (
          <Button
            variant="light"
            size="sm"
            leftSection={<IconRefresh size={16} />}
            onClick={onRefresh}
            loading={loading}
          >
            Refresh
          </Button>
        )}
      </Stack>
    );
  }

  // Limit display to first 50 ingresses for performance
  const displayedIngresses = sortedIngresses.slice(0, 50);
  const remaining = sortedIngresses.length - 50;

  return (
    <ScrollArea 
      h="calc(100vh - 180px)" 
      type="always"
      offsetScrollbars
      styles={{
        viewport: {
          paddingBottom: '8px',
        },
      }}
    >
      <Stack gap="xs">
        {displayedIngresses.map((ingress, index) => (
          <IngressItem
            key={ingress.id}
            ingress={ingress}
            onSelect={() => onSelect(ingress)}
            isSelected={index === selectedIndex}
          />
        ))}
        
        {remaining > 0 && (
          <Text c="dimmed" size="sm" ta="center" py="xs">
            {remaining} more results...
          </Text>
        )}
      </Stack>
    </ScrollArea>
  );
}
