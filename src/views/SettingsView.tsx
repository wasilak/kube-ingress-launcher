/**
 * SettingsView component - Route-based settings interface
 * 
 * This component provides the settings interface as a route instead of a modal.
 * It extracts the content from SettingsDialog and removes the Modal wrapper
 * while preserving all functionality including functional modals (PermissionsDialog).
 * 
 * Requirements: 6.1, 6.2, 6.5
 */

import { Stack, NumberInput, Switch, Select, Button, Group, Text, Alert, Divider, Badge, Kbd, ScrollArea, Container } from '@mantine/core';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Settings, VersionInfo } from '../types/ingress';
import { IconAlertCircle } from '@tabler/icons-react';
import { PermissionsDialog } from '../components/PermissionsDialog';
import { useTheme } from '../hooks/useTheme';

/**
 * SettingsView component for configuring application preferences
 * 
 * Features:
 * - Global keyboard shortcut configuration with recorder
 * - Refresh interval configuration (10-3600 seconds)
 * - Autostart with system toggle
 * - Kubernetes context selector
 * - Theme selector (light/dark/system)
 * - Auto-save on every change (no save button needed)
 * - Validation for all inputs
 * - Preserves functional modals (PermissionsDialog)
 * 
 * Requirements: 6.1, 6.2, 6.5
 */
export function SettingsView() {
  // Theme management
  const { themeMode, changeTheme } = useTheme();
  
  // Initialize settings with current theme from useTheme hook
  // This ensures theme is always in sync without needing a separate useEffect
  const [settings, setSettings] = useState<Settings>(() => ({
    globalShortcut: 'CmdOrCtrl+Shift+K',
    refreshIntervalSecs: 60,
    autostart: false,
    kubeContext: '',
    theme: themeMode === 'auto' ? 'system' : themeMode,
  }));
  
  const [contexts, setContexts] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [permissionType, setPermissionType] = useState<'accessibility' | 'autostart'>('accessibility');
  const [accessibilityGranted, setAccessibilityGranted] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  /**
   * Parse shortcut string into individual keys for Kbd display
   * Converts "CmdOrCtrl+Shift+K" into ["⌘", "⇧", "K"] on macOS
   * or ["Ctrl", "Shift", "K"] on other platforms
   */
  const parseShortcutKeys = (shortcut: string): string[] => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    return shortcut.split('+').map(key => {
      switch (key) {
        case 'CmdOrCtrl':
          return isMac ? '⌘' : 'Ctrl';
        case 'Shift':
          return isMac ? '⇧' : 'Shift';
        case 'Alt':
          return isMac ? '⌥' : 'Alt';
        case 'Ctrl':
          return isMac ? '⌃' : 'Ctrl';
        default:
          return key;
      }
    });
  };

  /**
   * Load settings and contexts on mount
   * Check accessibility permission
   * Load version information
   */
  useEffect(() => {
    loadSettings();
    loadContexts();
    checkAccessibility();
    loadVersionInfo();
  }, []);

  /**
   * Check accessibility permission status
   */
  const checkAccessibility = async () => {
    try {
      const granted = await invoke<boolean>('check_accessibility');
      setAccessibilityGranted(granted);
      
      // If permission is not granted but shortcut works, recheck after a delay
      // This handles the case where macOS hasn't updated the permission status yet
      if (!granted) {
        setTimeout(async () => {
          try {
            const recheckGranted = await invoke<boolean>('check_accessibility');
            setAccessibilityGranted(recheckGranted);
          } catch (err) {
            console.error('Failed to recheck accessibility permission:', err);
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to check accessibility permission:', err);
      setAccessibilityGranted(false);
    }
  };

  /**
   * Load version information
   */
  const loadVersionInfo = async () => {
    try {
      const info = await invoke<VersionInfo>('get_version_info');
      setVersionInfo(info);
    } catch (err) {
      console.error('Failed to load version info:', err);
    }
  };

  /**
   * Load current settings from backend
   */
  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const loaded = await invoke<Settings>('get_settings');
      setSettings(loaded);
    } catch (err) {
      setError(`Failed to load settings: ${err}`);
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load available Kubernetes contexts
   * Auto-select first context if none is selected
   */
  const loadContexts = async () => {
    try {
      const ctxs = await invoke<string[]>('get_contexts');
      setContexts(ctxs);
      
      // If contexts are available and no context is selected, select the first one
      if (ctxs.length > 0 && !settings.kubeContext) {
        handleSettingChange('kubeContext', ctxs[0]);
      }
    } catch (err) {
      console.error('Failed to load contexts:', err);
      // Don't show error for contexts - it's not critical
      setContexts([]);
    }
  };

  /**
   * Update a setting and auto-save to backend
   * Handle autostart permission errors
   */
  const handleSettingChange = async (key: keyof Settings, value: string | number | boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    
    try {
      setError(null);
      await invoke('update_settings', { settings: updated });
    } catch (err) {
      const errorMessage = String(err);
      
      // Check if it's an autostart permission error
      if (key === 'autostart' && errorMessage.includes('autostart')) {
        setPermissionType('autostart');
        setPermissionsDialogOpen(true);
        // Revert the change
        setSettings(settings);
      } else {
        setError(`Failed to save settings: ${err}`);
        console.error('Failed to save settings:', err);
        // Revert the change on error
        setSettings(settings);
      }
    }
  };

  /**
   * Start recording a new keyboard shortcut
   */
  const handleRecordShortcut = () => {
    setRecording(true);
    setError(null);
    
    let timeoutId: number | null = null;
    
    // Listen for the next key combination
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if only modifier keys are pressed
      if (['Control', 'Meta', 'Shift', 'Alt', 'Command'].includes(event.key)) {
        return;
      }
      
      event.preventDefault();
      event.stopPropagation();
      
      // Build shortcut string
      const parts: string[] = [];
      
      // Add modifiers in consistent order
      if (event.ctrlKey || event.metaKey) {
        parts.push('CmdOrCtrl');
      }
      if (event.shiftKey) {
        parts.push('Shift');
      }
      if (event.altKey) {
        parts.push('Alt');
      }
      
      // Add the main key
      parts.push(event.key.toUpperCase());
      
      // Require at least one modifier + main key (minimum 2 parts)
      if (parts.length >= 2) {
        const shortcut = parts.join('+');
        
        // Validate against system-reserved shortcuts
        const reserved = [
          'CmdOrCtrl+Q',
          'CmdOrCtrl+Tab',
          'CmdOrCtrl+Space',
          'CmdOrCtrl+W',
          'CmdOrCtrl+H',
          'CmdOrCtrl+M',
          'CmdOrCtrl+Alt+Esc',
        ];
        
        if (reserved.includes(shortcut)) {
          setError(`Shortcut ${shortcut} is reserved by the system`);
          setRecording(false);
          window.removeEventListener('keydown', handleKeyDown);
          if (timeoutId) clearTimeout(timeoutId);
          return;
        }
        
        // Update the shortcut
        handleSettingChange('globalShortcut', shortcut);
        setRecording(false);
        window.removeEventListener('keydown', handleKeyDown);
        if (timeoutId) clearTimeout(timeoutId);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Auto-cancel after 5 seconds
    timeoutId = setTimeout(() => {
      setRecording(false);
      window.removeEventListener('keydown', handleKeyDown);
    }, 5000) as unknown as number;
  };

  /**
   * Handle refresh interval change with validation
   */
  const handleRefreshIntervalChange = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    
    if (isNaN(numValue)) {
      return;
    }
    
    // Validation is done on the backend, but we can provide immediate feedback
    if (numValue < 10 || numValue > 3600) {
      setError('Refresh interval must be between 10 and 3600 seconds');
      return;
    }
    
    handleSettingChange('refreshIntervalSecs', numValue);
  };

  /**
   * Handle context change
   */
  const handleContextChange = async (value: string | null) => {
    if (value) {
      try {
        setError(null);
        await invoke('switch_context', { context: value });
        await handleSettingChange('kubeContext', value);
      } catch (err) {
        setError(`Failed to switch context: ${err}`);
        console.error('Failed to switch context:', err);
      }
    }
  };

  /**
   * Handle theme change
   * Updates theme immediately and persists to settings
   */
  const handleThemeChange = async (value: string | null) => {
    if (value && (value === 'light' || value === 'dark' || value === 'auto')) {
      try {
        setError(null);
        // Update theme immediately via useTheme hook
        await changeTheme(value as 'light' | 'dark' | 'auto');
        // Settings are auto-saved by changeTheme
      } catch (err) {
        setError(`Failed to change theme: ${err}`);
        console.error('Failed to change theme:', err);
      }
    }
  };

  return (
    <ScrollArea h="calc(100vh - 60px)" scrollbarSize={8} scrollbars="y">
      <Container size="lg" px="md">
        <Stack gap="md">
          {error && (
            <Text c="red" size="sm">
              {error}
            </Text>
          )}
      
      {/* Accessibility Permission Warning */}
      {!accessibilityGranted && (
          <Alert color="yellow" icon={<IconAlertCircle />}>
            <Text size="sm" fw={500} mb="xs">
              Accessibility permission check failed
            </Text>
            <Text size="sm" mb="xs">
              This can happen when the app's code signature changes (e.g., after rebuilding).
              macOS caches the signature and needs the permission to be refreshed.
            </Text>
            <Text size="sm" fw={500} mb="xs">
              To fix:
            </Text>
            <Text size="sm" component="ol" style={{ paddingLeft: '1.5rem', margin: 0 }}>
              <li>Open System Settings → Privacy & Security → Accessibility</li>
              <li>Find "Kube Ingress Launcher" in the list</li>
              <li>Uncheck the box, then check it again</li>
              <li>Click "Recheck" below to verify</li>
            </Text>
            <Group mt="xs" gap="xs">
              <Button
                size="xs"
                variant="light"
                onClick={() => {
                  setPermissionType('accessibility');
                  setPermissionsDialogOpen(true);
                }}
              >
                Open System Settings
              </Button>
              <Button
                size="xs"
                variant="subtle"
                onClick={checkAccessibility}
              >
                Recheck
              </Button>
            </Group>
          </Alert>
        )}
      
      {/* Global Shortcut Configuration */}
      <div>
        <Text size="sm" fw={500} mb="xs">
          Global Shortcut
        </Text>
        <Group gap="md" align="center">
          <Group gap="xs">
            {parseShortcutKeys(settings.globalShortcut).map((key, index) => (
              <Kbd key={index} size="md">{key}</Kbd>
            ))}
          </Group>
          <Button
            onClick={handleRecordShortcut}
            variant={recording ? 'filled' : 'light'}
            disabled={loading}
            size="sm"
          >
            {recording ? 'Press keys...' : 'Change'}
          </Button>
        </Group>
        <Text size="xs" c="dimmed" mt="xs">
          {recording 
            ? 'Press your desired key combination now...' 
            : 'Click Change to record a new keyboard shortcut'}
        </Text>
      </div>

      {/* Refresh Interval Configuration */}
      <NumberInput
        label="Refresh Interval (seconds)"
        description="How often to fetch ingress data from Kubernetes"
        value={settings.refreshIntervalSecs}
        onChange={handleRefreshIntervalChange}
        min={10}
        max={3600}
        step={10}
        disabled={loading}
      />

      {/* Autostart Configuration */}
      <Switch
        label="Autostart with system"
        description="Launch the application automatically when you log in"
        checked={settings.autostart}
        onChange={(e) => handleSettingChange('autostart', e.currentTarget.checked)}
        disabled={loading}
      />

      {/* Kubernetes Context Selector */}
      <Select
        label="Kubernetes Context"
        description="Select which Kubernetes cluster to connect to"
        data={contexts}
        value={settings.kubeContext || null}
        onChange={handleContextChange}
        placeholder={contexts.length === 0 ? 'No contexts available' : 'Select a context'}
        disabled={loading || contexts.length === 0}
        searchable
      />
      
      {contexts.length === 0 && (
        <Text size="xs" c="dimmed">
          No Kubernetes contexts found. Make sure your kubeconfig is properly configured.
        </Text>
      )}

      {/* Theme Selector */}
      <Select
        label="Theme"
        description="Choose your preferred color scheme"
        data={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'auto', label: 'Auto (System)' },
        ]}
        value={themeMode}
        onChange={handleThemeChange}
        disabled={loading}
      />

      {/* Version Information */}
      <Divider my="md" />
      
      {versionInfo && (
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Version Information
          </Text>
          
          <Group gap="xs">
            <Text size="sm" c="dimmed">Version:</Text>
            <Badge variant="light" size="sm">{versionInfo.version}</Badge>
          </Group>
          
          {versionInfo.gitBranch && (
            <Group gap="xs">
              <Text size="sm" c="dimmed">Branch:</Text>
              <Badge variant="light" color="blue" size="sm">{versionInfo.gitBranch}</Badge>
            </Group>
          )}
          
          {versionInfo.gitCommit && (
            <Group gap="xs">
              <Text size="sm" c="dimmed">Commit:</Text>
              <Badge variant="light" color="gray" size="sm" style={{ fontFamily: 'monospace' }}>
                {versionInfo.gitCommit}
              </Badge>
            </Group>
          )}
        </Stack>
      )}
      
      {/* Permissions Dialog (functional modal - preserved) */}
      <PermissionsDialog
        opened={permissionsDialogOpen}
        onClose={() => {
          setPermissionsDialogOpen(false);
          checkAccessibility(); // Recheck after closing
        }}
        permissionType={permissionType}
      />
        </Stack>
      </Container>
    </ScrollArea>
  );
}
