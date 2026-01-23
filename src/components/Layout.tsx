/**
 * Layout component - Wrapper for all routes with burger menu
 * 
 * Provides:
 * - Consistent layout across all routes
 * - Burger menu button visible on all routes
 * - Navigation drawer with current path tracking
 * - Outlet for nested route content
 * 
 * Requirements: 3.1, 3.2
 */

import { Outlet, useLocation } from 'react-router-dom';
import { Stack, Group, Burger } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { NavigationDrawer } from './NavigationDrawer';

/**
 * Layout component
 * 
 * Features:
 * - Wraps all routes with consistent structure
 * - Burger menu always visible for navigation
 * - Navigation drawer with current path tracking
 * - Outlet renders matched child route
 * - Maintains drag region for window management
 */
export function Layout() {
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const location = useLocation();

  return (
    <div className="app-container" data-tauri-drag-region>
      <Stack gap="md" p="md">
        {/* Burger menu - shown on all views */}
        <Group gap="sm" className="no-drag" align="center" justify="flex-end">
          <Burger
            opened={drawerOpened}
            onClick={openDrawer}
            size="sm"
            aria-label="Open navigation menu"
          />
        </Group>
        
        {/* Route content */}
        <div className="no-drag">
          <Outlet />
        </div>
      </Stack>

      {/* Navigation drawer */}
      <NavigationDrawer
        opened={drawerOpened}
        onClose={closeDrawer}
        currentPath={location.pathname}
      />
    </div>
  );
}
