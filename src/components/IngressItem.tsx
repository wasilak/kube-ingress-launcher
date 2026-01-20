import { useState } from 'react';
import { Stack, Group, Text, Badge, Button } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import { IngressData } from '../types/ingress';
import { invoke } from '@tauri-apps/api/core';

/**
 * Props for the IngressItem component
 * 
 * Requirements: 7.5, 7.6, 8.1-8.4, 12.6
 */
interface IngressItemProps {
  /** Ingress resource to display */
  ingress: IngressData;
  
  /** Callback when the ingress is selected */
  onSelect: () => void;
}

/**
 * IngressItem component displays a single Kubernetes ingress resource
 * 
 * Features:
 * - Displays name, namespace, hosts, and TLS badge
 * - Expandable URL list (click to expand/collapse)
 * - Opens URLs in default browser via Tauri command
 * - Hover effect for better UX
 * - Semi-transparent background for vibrancy effect
 * 
 * Requirements: 7.5, 7.6, 8.1-8.4, 12.6
 */
export function IngressItem({ ingress, onSelect }: IngressItemProps) {
  const [expanded, setExpanded] = useState(false);

  /**
   * Opens a URL in the default system browser
   * Calls the open_url Tauri command and hides the window
   * 
   * Requirements: 8.1-8.4
   */
  const handleUrlClick = async (url: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent item expansion when clicking URL
    
    try {
      await invoke('open_url', { url });
      // Window will be hidden by the Tauri command
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  /**
   * Toggles the expanded state to show/hide URLs
   */
  const handleItemClick = () => {
    setExpanded(!expanded);
    onSelect();
  };

  return (
    <div
      onClick={handleItemClick}
      style={{
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      }}
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

      {expanded && ingress.urls.length > 0 && (
        <Stack gap="xs" mt="sm">
          {ingress.urls.map((url) => (
            <Button
              key={url}
              variant="subtle"
              size="xs"
              leftSection={<IconExternalLink size={14} />}
              onClick={(e) => handleUrlClick(url, e)}
              style={{ justifyContent: 'flex-start' }}
            >
              {url}
            </Button>
          ))}
        </Stack>
      )}
    </div>
  );
}
