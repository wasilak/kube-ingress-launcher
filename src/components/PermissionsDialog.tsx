import { Modal, Stack, Text, Button, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { invoke } from '@tauri-apps/api/core';

interface PermissionsDialogProps {
  opened: boolean;
  onClose: () => void;
  permissionType: 'accessibility' | 'autostart';
}

/**
 * PermissionsDialog Component
 * 
 * Displays a dialog explaining why a permission is needed and provides
 * a button to open System Settings.
 * 
 * Requirements:
 * - 10.2: Display dialog with explanation and "Open System Settings" button
 * - 10.3: Open System Settings to appropriate pane
 * - 10.5: Handle permission failures gracefully
 */
export function PermissionsDialog({ opened, onClose, permissionType }: PermissionsDialogProps) {
  const handleOpenSettings = async () => {
    try {
      if (permissionType === 'accessibility') {
        await invoke('request_accessibility');
      }
      onClose();
    } catch (error) {
      console.error('Failed to open System Settings:', error);
    }
  };

  const getTitle = () => {
    return permissionType === 'accessibility' 
      ? 'Accessibility Permission Required'
      : 'Autostart Permission Required';
  };

  const getMessage = () => {
    if (permissionType === 'accessibility') {
      return 'Keyboard shortcuts require Accessibility permission. Please grant permission in System Settings > Privacy & Security > Accessibility.';
    } else {
      return 'Could not enable autostart. Please check System Settings > General > Login Items.';
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={getTitle()}
      size="md"
    >
      <Stack gap="md">
        <Alert color="yellow" icon={<IconAlertCircle />}>
          <Text size="sm">{getMessage()}</Text>
        </Alert>

        <Text size="sm" c="dimmed">
          {permissionType === 'accessibility' 
            ? 'After granting permission, you may need to restart the application for the global shortcut to work.'
            : 'You can manually add the application to Login Items in System Settings.'}
        </Text>

        <Stack gap="xs">
          <Button onClick={handleOpenSettings} fullWidth>
            Open System Settings
          </Button>
          <Button variant="light" onClick={onClose} fullWidth>
            Close
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
