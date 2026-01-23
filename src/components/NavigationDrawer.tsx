/**
 * NavigationDrawer component - Side drawer with navigation links
 * 
 * Provides navigation to:
 * - Search (main view)
 * - Statistics
 * - Options/Settings
 */

import { Drawer, Stack, NavLink } from '@mantine/core';
import { IconSearch, IconChartBar, IconSettings } from '@tabler/icons-react';

interface NavigationDrawerProps {
  opened: boolean;
  onClose: () => void;
  onNavigate: (destination: 'search' | 'statistics' | 'settings') => void;
}

/**
 * NavigationDrawer component
 * 
 * Features:
 * - Opens from the right side
 * - Navigation links with icons
 * - Closes after navigation
 */
export function NavigationDrawer({ opened, onClose, onNavigate }: NavigationDrawerProps) {
  const handleNavigate = (destination: 'search' | 'statistics' | 'settings') => {
    onNavigate(destination);
    onClose();
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      title="Navigation"
      size="xs"
    >
      <Stack gap="xs">
        <NavLink
          label="Search"
          description="Search ingress resources"
          leftSection={<IconSearch size={20} />}
          onClick={() => handleNavigate('search')}
          active={true}
        />
        
        <NavLink
          label="Statistics"
          description="View usage statistics"
          leftSection={<IconChartBar size={20} />}
          onClick={() => handleNavigate('statistics')}
        />
        
        <NavLink
          label="Options"
          description="Configure settings"
          leftSection={<IconSettings size={20} />}
          onClick={() => handleNavigate('settings')}
        />
      </Stack>
    </Drawer>
  );
}
