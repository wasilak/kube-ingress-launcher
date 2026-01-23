/**
 * Layout component - Wrapper for all routes with burger menu
 * 
 * Provides:
 * - Consistent layout across all routes
 * - Burger menu button visible on all routes
 * - Navigation drawer with current path tracking
 * - Outlet for nested route content
 * - Fade transitions between routes (200ms duration)
 * 
 * Requirements: 3.1, 3.2, 15.1, 15.2, 15.3
 */

import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Stack, Group, Burger, Transition } from '@mantine/core';
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
 * - Fade transitions on route changes (200ms)
 * 
 * Transition Implementation:
 * - Uses Mantine's Transition component with "fade" effect
 * - Duration: 200ms for responsiveness (Requirement 15.2)
 * - Timing function: "ease" for smooth animation
 * - Mounted state tracks location changes to trigger transitions
 * - Brief unmount/remount cycle creates fade effect between routes
 */
export function Layout() {
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const location = useLocation();
  const [mounted, setMounted] = useState(true);

  // Trigger transition on route change
  useEffect(() => {
    // Unmount to trigger fade out
    setMounted(false);
    
    // Remount after a brief delay to trigger fade in
    const timer = setTimeout(() => {
      setMounted(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="app-container" data-tauri-drag-region>
      <Stack gap="xs" p="xs">
        {/* Burger menu - shown on all views */}
        <Group gap="sm" className="no-drag" align="center" justify="flex-end">
          <Burger
            opened={drawerOpened}
            onClick={openDrawer}
            size="sm"
            aria-label="Open navigation menu"
          />
        </Group>
        
        {/* Route content with fade transition */}
        <div className="no-drag">
          <Transition
            mounted={mounted}
            transition="fade"
            duration={200}
            timingFunction="ease"
          >
            {(styles) => (
              <div style={styles}>
                <Outlet />
              </div>
            )}
          </Transition>
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
