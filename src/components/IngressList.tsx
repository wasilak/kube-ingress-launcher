import { Stack, Text, Button } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { IngressData } from '../types/ingress';
import { IngressItem } from './IngressItem';

/**
 * Props for the IngressList component
 * 
 * Requirements: 7.5, 7.10, 12.5, 8.5, 11.4
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
 * 
 * Requirements: 7.5, 7.10, 12.5, 8.5, 11.4
 */
export function IngressList({ ingresses, onSelect, selectedIndex = -1, onRefresh, loading = false }: IngressListProps) {
  // Show empty state when no ingresses
  if (ingresses.length === 0) {
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
  const displayedIngresses = ingresses.slice(0, 50);
  const remaining = ingresses.length - 50;

  return (
    <Stack gap="xs" style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'scroll' }}>
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
  );
}
