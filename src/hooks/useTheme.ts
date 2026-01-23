/**
 * useTheme hook for managing application theme
 * 
 * Features:
 * - Detects system theme preference
 * - Listens for system theme changes
 * - Applies theme based on user preference (light/dark/auto)
 * - Persists theme preference to settings
 * 
 * Requirements: 12.1, 12.2, 17.1-17.12
 */

import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { Settings } from '../types/ingress';

export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Hook for managing theme state and preferences
 * 
 * Uses Mantine's built-in color scheme management:
 * - colorScheme: The user's preference ('light', 'dark', or 'auto')
 * - computedColorScheme: The actual applied scheme ('light' or 'dark')
 * - setColorScheme: Function to change the theme mode
 * 
 * Requirements: 12.1, 12.2, 17.1-17.12
 */
export function useTheme() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('dark');

  /**
   * Load theme preference from settings on mount
   * 
   * Requirements: 17.2, 17.10
   */
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const settings = await invoke<Settings>('get_settings');
        // Map 'system' to 'auto' for Mantine compatibility
        const mode = settings.theme === 'system' ? 'auto' : settings.theme as ThemeMode;
        setColorScheme(mode);
      } catch (err) {
        console.error('Failed to load theme:', err);
        // Default to auto theme on error
        setColorScheme('auto');
      }
    };

    loadTheme();
  }, [setColorScheme]);

  /**
   * Change theme mode and persist to settings
   * 
   * Requirements: 17.8, 17.9
   */
  const changeTheme = async (mode: ThemeMode) => {
    setColorScheme(mode);

    // Save to settings (map 'auto' back to 'system' for backend)
    try {
      const settings = await invoke<Settings>('get_settings');
      const themeValue = mode === 'auto' ? 'system' : mode;
      await invoke('update_settings', {
        settings: { ...settings, theme: themeValue },
      });
    } catch (err) {
      console.error('Failed to save theme:', err);
    }
  };

  // Map colorScheme back to our ThemeMode type for the UI
  const themeMode: ThemeMode = colorScheme as ThemeMode;

  return { colorScheme: computedColorScheme, themeMode, changeTheme };
}
