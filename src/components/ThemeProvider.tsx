/**
 * ThemeProvider component for managing application theme
 * 
 * This component wraps the entire application and provides theme management
 * at the top level, ensuring all components (including modals) receive the
 * correct theme.
 * 
 * Requirements: 12.1, 12.2, 17.1-17.12
 */

import { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { useTheme } from '../hooks/useTheme';

interface ThemeProviderProps {
  children: ReactNode;
  theme: ReturnType<typeof import('@mantine/core').createTheme>;
}

/**
 * ThemeProvider wraps the application with MantineProvider and applies
 * the current color scheme from useTheme hook
 * 
 * This ensures:
 * - Theme is applied at the top level
 * - All components (including modals) inherit the theme
 * - Theme changes are immediately reflected throughout the app
 * 
 * Requirements: 12.1, 12.2, 17.1-17.12
 */
export function ThemeProvider({ children, theme }: ThemeProviderProps) {
  const { colorScheme } = useTheme();

  return (
    <MantineProvider theme={theme} forceColorScheme={colorScheme}>
      {children}
    </MantineProvider>
  );
}
