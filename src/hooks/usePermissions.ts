import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface PermissionsState {
  accessibility: boolean;
  autostart: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * usePermissions Hook
 * 
 * Manages macOS permissions state including accessibility and autostart.
 * 
 * Requirements:
 * - 10.1: Check for accessibility permission
 * - 10.6: Gracefully handle missing permissions
 * - 10.7: Detect permission changes while app is running
 */
export function usePermissions() {
  const [state, setState] = useState<PermissionsState>({
    accessibility: false,
    autostart: false,
    loading: true,
    error: null,
  });

  const checkPermissions = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const [accessibilityGranted, autostartEnabled] = await Promise.all([
        invoke<boolean>('check_accessibility'),
        invoke<boolean>('check_autostart'),
      ]);

      setState({
        accessibility: accessibilityGranted,
        autostart: autostartEnabled,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to check permissions',
      }));
    }
  };

  const requestAccessibility = async () => {
    try {
      await invoke('request_accessibility');
    } catch (error) {
      console.error('Failed to request accessibility permission:', error);
      throw error;
    }
  };

  const enableAutostart = async () => {
    try {
      await invoke('enable_app_autostart');
      await checkPermissions(); // Refresh state
    } catch (error) {
      console.error('Failed to enable autostart:', error);
      throw error;
    }
  };

  const disableAutostart = async () => {
    try {
      await invoke('disable_app_autostart');
      await checkPermissions(); // Refresh state
    } catch (error) {
      console.error('Failed to disable autostart:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkPermissions();

    // Check permissions periodically to detect changes
    const interval = setInterval(checkPermissions, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    ...state,
    checkPermissions,
    requestAccessibility,
    enableAutostart,
    disableAutostart,
  };
}
