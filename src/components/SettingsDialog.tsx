import { Modal, Stack, TextInput, NumberInput, Switch, Select, Button, Group, Text, Alert } from '@mantine/core';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Settings } from '../types/ingress';
import { IconAlertCircle } from '@tabler/icons-react';
import { PermissionsDialog } from './PermissionsDialog';

/**
 * Props for the SettingsDialog component
 * 
 * Requirements: 9.1-9.20, 12.8
 */
interface SettingsDialogProps {
  /** Whether the dialog is open */
  opened: boolean;
  
  /** Callback when the dialog should close */
  onClose: () => void;
}

/**
 * SettingsDialog component for configuring application preferences
 * 
 * Features:
 * - Global keyboard shortcut configuration with recorder
 * - Refresh interval configuration (10-3600 seconds)
 * - Autostart with system toggle
 * - Kubernetes context selector
 * - Auto-save on every change (no save button needed)
 * - Validation for all inputs
 * 
 * Requirements: 9.1-9.20, 12.8
 */
export function SettingsDialog({ opened, onClose }: SettingsDialogProps) {
  const [settings, setSettings] = useState<Settings>({
    globalShortcut: 'CmdOrCtrl+Shift+K',
    refreshIntervalSecs: 60,
    autostart: false,
    kubeContext: '',
  });
  
  const [contexts, setContexts] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [permissionType, setPermissionType] = useState<'accessibility' | 'autostart'>('accessibility');
  const [accessibilityGranted, setAccessibilityGranted] = useState(false);

  /**
   * Load settings and contexts when dialog opens
   * Check accessibility permission
   * 
   * Requirements: 9.1-9.20, 10.1
   */
  useEffect(() => {
    if (opened) {
      loadSettings();
      loadContexts();
      checkAccessibility();
    }
  }, [opened]);

  /**
   * Check accessibility permission status
   * 
   * Requirements: 10.1
   */
  const checkAccessibility = async () => {
    try {
      const granted = await invoke<boolean>('check_accessibility');
      setAccessibilityGranted(granted);
    } catch (err) {
      console.error('Failed to check accessibility permission:', err);
      setAccessibilityGranted(false);
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
   * 
   * Requirements: 9.15-9.17
   */
  const loadContexts = async () => {
    try {
      const ctxs = await invoke<string[]>('get_contexts');
      setContexts(ctxs);
    } catch (err) {
      console.error('Failed to load contexts:', err);
      // Don't show error for contexts - it's not critical
      setContexts([]);
    }
  };

  /**
   * Update a setting and auto-save to backend
   * Handle autostart permission errors
   * 
   * Requirements: 9.18-9.20 (auto-save), 10.4-10.5 (autostart handling)
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
   * 
   * Requirements: 9.3-9.8
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
   * 
   * Requirements: 9.9-9.11
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
   * 
   * Requirements: 9.15-9.17
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

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Settings"
      size="md"
      centered
    >
      <Stack gap="md">
        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}
        
        {/* Accessibility Permission Warning */}
        {!accessibilityGranted && (
          <Alert color="yellow" icon={<IconAlertCircle />}>
            <Text size="sm">
              Accessibility permission not granted. Global shortcuts will not work.
            </Text>
            <Button
              size="xs"
              variant="light"
              mt="xs"
              onClick={() => {
                setPermissionType('accessibility');
                setPermissionsDialogOpen(true);
              }}
            >
              Grant Permission
            </Button>
          </Alert>
        )}
        
        {/* Global Shortcut Configuration */}
        <div>
          <Text size="sm" fw={500} mb="xs">
            Global Shortcut
          </Text>
          <Group>
            <TextInput
              value={settings.globalShortcut}
              readOnly
              style={{ flex: 1 }}
              disabled={loading}
            />
            <Button
              onClick={handleRecordShortcut}
              variant={recording ? 'filled' : 'light'}
              disabled={loading}
            >
              {recording ? 'Press keys...' : 'Record'}
            </Button>
          </Group>
          <Text size="xs" c="dimmed" mt="xs">
            Press the Record button and then press your desired key combination
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
          clearable
        />
        
        {contexts.length === 0 && (
          <Text size="xs" c="dimmed">
            No Kubernetes contexts found. Make sure your kubeconfig is properly configured.
          </Text>
        )}
      </Stack>
      
      {/* Permissions Dialog */}
      <PermissionsDialog
        opened={permissionsDialogOpen}
        onClose={() => {
          setPermissionsDialogOpen(false);
          checkAccessibility(); // Recheck after closing
        }}
        permissionType={permissionType}
      />
    </Modal>
  );
}
