import { Alert, Button, Group, Text } from '@mantine/core';
import { IconAlertCircle, IconCopy } from '@tabler/icons-react';
import { ErrorInfo } from '../types/ingress';

/**
 * Props for the ErrorBanner component
 * 
 * Requirements: 7.9, 12.7
 */
interface ErrorBannerProps {
  /** Error information to display */
  error: ErrorInfo;
}

/**
 * ErrorBanner component displays error messages with copy functionality
 * 
 * Features:
 * - Displays error message and timestamp
 * - "Copy Error" button using navigator.clipboard
 * - Red alert color for visibility
 * - Includes error details if available
 * 
 * Requirements: 7.9, 12.7
 */
export function ErrorBanner({ error }: ErrorBannerProps) {
  /**
   * Copies error information to clipboard
   * Formats error with message, details, and timestamp
   */
  const handleCopyError = async () => {
    const errorText = `Error: ${error.message}\nDetails: ${error.details || 'N/A'}\nTime: ${error.timestamp}`;
    
    try {
      await navigator.clipboard.writeText(errorText);
      // Error copied successfully - no need to log in production
    } catch (err) {
      console.error('Failed to copy error to clipboard:', err);
    }
  };

  /**
   * Formats the timestamp for display
   * Converts ISO 8601 timestamp to readable format
   */
  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  return (
    <Alert 
      color="red" 
      title="Error" 
      icon={<IconAlertCircle />}
      styles={{
        root: {
          backgroundColor: 'rgba(250, 82, 82, 0.1)',
          borderColor: 'rgba(250, 82, 82, 0.3)',
        },
      }}
    >
      <Group justify="space-between" align="flex-start">
        <div style={{ flex: 1 }}>
          <Text size="sm" fw={500}>
            {error.message}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {formatTimestamp(error.timestamp)}
          </Text>
        </div>
        <Button
          size="xs"
          variant="light"
          color="red"
          leftSection={<IconCopy size={14} />}
          onClick={handleCopyError}
        >
          Copy Error
        </Button>
      </Group>
    </Alert>
  );
}
