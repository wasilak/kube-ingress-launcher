import { useState } from 'react';
import { Stack, Group, Text, Badge } from '@mantine/core';
import { IngressData } from '../types/ingress';

/**
 * Props for the IngressItem component
 * 
 * Requirements: 7.5, 7.6, 8.1-8.4, 12.6, 8.5, 11.4
 */
interface IngressItemProps {
  /** Ingress resource to display */
  ingress: IngressData;
  
  /** Callback when the ingress is selected */
  onSelect: () => void;
  
  /** Whether this item is currently selected via keyboard navigation */
  isSelected?: boolean;
}

/**
 * IngressItem component displays a single Kubernetes ingress resource
 * 
 * Features:
 * - Displays name, namespace, hosts, and TLS badge
 * - Clicking opens the URL in default browser
 * - Hover effect for better UX
 * - Semi-transparent background for vibrancy effect
 * - Visual highlight when selected via keyboard navigation
 * 
 * Requirements: 7.5, 7.6, 8.1-8.4, 12.6, 8.5, 11.4
 */
export function IngressItem({ ingress, onSelect, isSelected = false }: IngressItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  /**
   * Handles item click - calls onSelect which will open the URL
   */
  const handleItemClick = () => {
    onSelect();
  };

  // Calculate background color based on selection and hover state
  const getBackgroundColor = () => {
    if (isSelected) {
      return 'rgba(66, 153, 225, 0.3)'; // Blue highlight for selected
    }
    if (isHovered) {
      return 'rgba(255, 255, 255, 0.08)';
    }
    return 'rgba(255, 255, 255, 0.05)';
  };

  return (
    <div
      onClick={handleItemClick}
      style={{
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: getBackgroundColor(),
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        border: isSelected ? '1px solid rgba(66, 153, 225, 0.5)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Group justify="space-between">
        <Stack gap={4}>
          <Group gap="xs">
            <Text fw={500}>{ingress.name}</Text>
            <Badge size="sm" variant="light">
              {ingress.namespace}
            </Badge>
            {ingress.tls && (
              <Badge size="sm" color="green">
                TLS
              </Badge>
            )}
          </Group>
          <Text size="sm" c="dimmed">
            {ingress.hosts.length > 0 ? ingress.hosts.join(', ') : 'No hosts'}
          </Text>
        </Stack>
      </Group>
    </div>
  );
}
