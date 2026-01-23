/**
 * NavigationDrawer component - Side drawer with navigation links
 * 
 * Provides navigation to:
 * - Search (main view)
 * - Statistics
 * - Options/Settings
 * 
 * Updated for React Router integration with current path tracking
 */

import { Drawer, Stack, NavLink } from '@mantine/core';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { IconSearch, IconChartBar, IconSettings } from '@tabler/icons-react';

interface NavigationDrawerProps {
  opened: boolean;
  onClose: () => void;
  currentPath: string;
}

/**
 * NavigationDrawer component
 * 
 * Features:
 * - Opens from the right side
 * - Navigation links with icons using React Router
 * - Closes after navigation
 * - Highlights currently active route
 */
export function NavigationDrawer({ opened, onClose, currentPath }: NavigationDrawerProps) {
  const navItems = [
    { to: '/', icon: IconSearch, label: 'Search', description: 'Search ingress resources' },
    { to: '/statistics', icon: IconChartBar, label: 'Statistics', description: 'View usage statistics' },
    { to: '/settings', icon: IconSettings, label: 'Options', description: 'Configure settings' },
  ];

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      title="Navigation"
      size="xs"
    >
      <Stack gap="xs">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            label={item.label}
            description={item.description}
            leftSection={<item.icon size={20} />}
            active={currentPath === item.to}
            component={RouterNavLink}
            to={item.to}
            onClick={onClose}
          />
        ))}
      </Stack>
    </Drawer>
  );
}
