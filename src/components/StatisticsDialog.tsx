/**
 * StatisticsDialog component - Modal wrapper for usage statistics
 * 
 * This component wraps the StatisticsView in a fullscreen modal dialog,
 * similar to the SettingsDialog pattern.
 * 
 * Requirements: 4.1, 4.2, 15.3
 */

import { Modal, ScrollArea } from '@mantine/core';
import { StatisticsView } from './StatisticsView';

/**
 * Props for the StatisticsDialog component
 */
interface StatisticsDialogProps {
  /** Whether the dialog is open */
  opened: boolean;
  
  /** Callback when the dialog should close */
  onClose: () => void;
}

/**
 * StatisticsDialog component for displaying usage statistics
 * 
 * Features:
 * - Fullscreen modal dialog
 * - Wraps StatisticsView component
 * - Matches SettingsDialog pattern
 * - Theme support via MantineProvider
 * 
 * Requirements: 4.1, 4.2, 15.3
 */
export function StatisticsDialog({ opened, onClose }: StatisticsDialogProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Usage Statistics"
      fullScreen
      scrollAreaComponent={ScrollArea.Autosize}
      transitionProps={{ transition: 'fade', duration: 200 }}
      styles={{
        header: {
          paddingTop: '24px', // Add padding to avoid traffic light buttons
        },
      }}
    >
      <StatisticsView />
    </Modal>
  );
}
