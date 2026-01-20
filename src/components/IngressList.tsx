import { Stack, Text } from '@mantine/core';
import { IngressData } from '../types/ingress';
import { IngressItem } from './IngressItem';

/**
 * Props for the IngressList component
 * 
 * Requirements: 7.5, 7.10, 12.5
 */
interface IngressListProps {
  /** List of ingress resources to display */
  ingresses: IngressData[];
  
  /** Callback when an ingress is selected */
  onSelect: (ingress: IngressData) => void;
}

/**
 * IngressList component displays a list of Kubernetes ingress resources
 * 
 * Features:
 * - Displays first 50 ingresses for performance
 * - Shows "X more results" message when list is truncated
 * - Shows "No ingresses found" when list is empty
 * - Uses Mantine Stack for vertical layout
 * - Scrollable container with max height
 * 
 * Requirements: 7.5, 7.10, 12.5
 */
export function IngressList({ ingresses, onSelect }: IngressListProps) {
  // Show empty state when no ingresses
  if (ingresses.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No ingresses found
      </Text>
    );
  }

  // Limit display to first 50 ingresses for performance
  const displayedIngresses = ingresses.slice(0, 50);
  const remaining = ingresses.length - 50;

  return (
    <Stack gap="xs" style={{ maxHeight: '400px', overflowY: 'auto' }}>
      {displayedIngresses.map((ingress) => (
        <IngressItem
          key={ingress.id}
          ingress={ingress}
          onSelect={() => onSelect(ingress)}
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
