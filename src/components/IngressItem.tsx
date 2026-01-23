import { useState } from 'react';
import { Stack, Group, Text, Badge, useMantineColorScheme } from '@mantine/core';
import { IngressData } from '../types/ingress';
import { useUsageCounts } from '../hooks/useUsageCounts';
import { UsageBadge } from './UsageBadge';

/**
 * Props for the IngressItem component
 * 
 * Requirements: 7.5, 7.6, 8.1-8.4, 12.6, 8.5, 11.4, 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 15.1
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
 * - Displays usage count badge showing how many times the link has been opened
 * - Clicking opens the URL in default browser and records the open event
 * - Hover effect for better UX
 * - Semi-transparent background for vibrancy effect
 * - Visual highlight when selected via keyboard navigation
 * 
 * Requirements: 7.5, 7.6, 8.1-8.4, 12.6, 8.5, 11.4, 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 15.1
 */
export function IngressItem({ ingress, onSelect, isSelected = false }: IngressItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Get usage counts and recordOpen function
  const { counts, recordOpen } = useUsageCounts();
  
  // Get the usage count for this ingress (use first host as key)
  const usageCount = ingress.hosts.length > 0 ? (counts[ingress.hosts[0]] || 0) : 0;

  /**
   * Handles item click - records the open event then calls onSelect to open the URL
   * 
   * Requirements: 1.1, 2.5, 15.1
   */
  const handleItemClick = async () => {
    // Record the open event before opening URL
    if (ingress.hosts.length > 0) {
      await recordOpen(ingress.hosts[0]);
    }
    
    // Call the original onSelect callback to open the URL
    onSelect();
  };

  // Calculate background color based on selection, hover state, and theme
  const getBackgroundColor = () => {
    if (isSelected) {
      return isDark ? 'rgba(66, 153, 225, 0.3)' : 'rgba(66, 153, 225, 0.2)'; // Blue highlight for selected
    }
    if (isHovered) {
      return isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
    }
    return isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)';
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
              <Badge 
                size="sm" 
                color="green.6"
                variant="filled"
                data-tls-badge="true"
              >
                TLS
              </Badge>
            )}
          </Group>
          <Text size="sm" c="dimmed">
            {ingress.hosts.length > 0 ? ingress.hosts.join(', ') : 'No hosts'}
          </Text>
        </Stack>
        
        {/* Usage badge - positioned on the right side */}
        <UsageBadge count={usageCount} />
      </Group>
    </div>
  );
}
