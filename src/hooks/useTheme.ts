/**
 * useTheme hook for managing application theme
 * 
 * Features:
 * - Detects system theme preference
 * - Listens for system theme changes
 * - Applies theme based on user preference (light/dark/system)
 * - Persists theme preference to settings
 * 
 * Requirements: 12.1, 12.2, 17.1-17.12
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Settings } from '../types/ingress';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';

/**
 * Hook for managing theme state and preferences
 * 
 * Returns:
 * - colorScheme: The actual color scheme to apply ('light' or 'dark')
 * - themeMode: The user's theme preference ('light', 'dark', or 'system')
 * - changeTheme: Function to change the theme mode
 * 
 * Requirements: 12.1, 12.2, 17.1-17.12
 */
export function useTheme() {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('dark');
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');

  /**
   * Detect system theme preference
   * 
   * Requirements: 17.3, 17.12
   */
  const getSystemTheme = (): ColorScheme => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? 'dark' : 'light';
  };

  /**
   * Apply theme based on mode
   * 
   * Requirements: 17.5, 17.6
   */
  const applyTheme = (mode: ThemeMode) => {
    if (mode === 'system') {
      setColorScheme(getSystemTheme());
    } else {
      setColorScheme(mode);
    }
  };

  /**
   * Load theme preference from settings on mount
   * 
   * Requirements: 17.2, 17.10
   */
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const settings = await invoke<Settings>('get_settings');
        const mode = (settings.theme || 'system') as ThemeMode;
        setThemeMode(mode);
        applyTheme(mode);
      } catch (err) {
        console.error('Failed to load theme:', err);
        // Default to system theme on error
        setThemeMode('system');
        applyTheme('system');
      }
    };

    loadTheme();
  }, []);

  /**
   * Listen for system theme changes when in system mode
   * 
   * Requirements: 17.4, 17.12
   */
  useEffect(() => {
    if (themeMode !== 'system') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setColorScheme(e.matches ? 'dark' : 'light');
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [themeMode]);

  /**
   * Change theme mode and persist to settings
   * 
   * Requirements: 17.8, 17.9
   */
  const changeTheme = async (mode: ThemeMode) => {
    setThemeMode(mode);
    applyTheme(mode);

    // Save to settings
    try {
      const settings = await invoke<Settings>('get_settings');
      await invoke('update_settings', {
        settings: { ...settings, theme: mode },
      });
    } catch (err) {
      console.error('Failed to save theme:', err);
    }
  };

  return { colorScheme, themeMode, changeTheme };
}
