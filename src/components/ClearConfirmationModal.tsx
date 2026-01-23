/**
 * ClearConfirmationModal component - Confirmation dialog for clearing all statistics
 * 
 * This component provides a confirmation dialog before clearing all usage statistics:
 * - Warning message about irreversible action
 * - Cancel button to abort the operation
 * - Clear All button to confirm the operation
 * 
 * Requirements: 9.2, 9.3, 9.5
 */

import { Modal, Stack, Text, Group, Button } from '@mantine/core';

/**
 * Props for the ClearConfirmationModal component
 * 
 * Requirements: 9.2, 9.3, 9.5
 */
interface ClearConfirmationModalProps {
  /** Whether the modal is opened */
  opened: boolean;
  
  /** Callback when the user confirms clearing all statistics */
  onConfirm: () => void;
  
  /** Callback when the user cancels the operation */
  onCancel: () => void;
}

/**
 * ClearConfirmationModal component displays a confirmation dialog
 * 
 * Features:
 * - Warning message about irreversible action
 * - Cancel button (light variant) to abort
 * - Clear All button (red) to confirm
 * - Centered modal for better UX
 * 
 * Requirements: 9.2, 9.3, 9.5
 */
export function ClearConfirmationModal({
  opened,
  onConfirm,
  onCancel,
}: ClearConfirmationModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onCancel}
      title="Clear All Statistics"
      centered
    >
      <Stack gap="md">
        <Text>
          Are you sure you want to clear all usage statistics? This cannot be undone.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="light" onClick={onCancel}>
            Cancel
          </Button>
          <Button color="red" onClick={onConfirm}>
            Clear All
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
