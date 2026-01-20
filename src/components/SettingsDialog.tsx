import { Modal, Stack, TextInput, NumberInput, Switch, Select, Button, Group, Text } from '@mantine/core';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Settings } from '../types/ingress';

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

  /**
   * Load settings and contexts when dialog opens
   * 
   * Requirements: 9.1-9.20
   */
  useEffect(() => {
    if (opened) {
      loadSettings();
      loadContexts();
    }
  }, [opened]);

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
   * 
   * Requirements: 9.18-9.20 (auto-save)
   */
  const handleSettingChange = async (key: keyof Settings, value: string | number | boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    
    try {
      setError(null);
      await invoke('update_settings', { settings: updated });
    } catch (err) {
      setError(`Failed to save settings: ${err}`);
      console.error('Failed to save settings:', err);
      // Revert the change on error
      setSettings(settings);
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
    
    // Listen for the next key combination
    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      // Build shortcut string
      const parts: string[] = [];
      
      if (event.ctrlKey || event.metaKey) {
        parts.push('CmdOrCtrl');
      }
      if (event.shiftKey) {
        parts.push('Shift');
      }
      if (event.altKey) {
        parts.push('Alt');
      }
      
      // Add the main key (ignore modifier keys themselves)
      if (!['Control', 'Meta', 'Shift', 'Alt'].includes(event.key)) {
        parts.push(event.key.toUpperCase());
      }
      
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
          return;
        }
        
        // Update the shortcut
        handleSettingChange('globalShortcut', shortcut);
        setRecording(false);
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Auto-cancel after 5 seconds
    setTimeout(() => {
      if (recording) {
        setRecording(false);
        window.removeEventListener('keydown', handleKeyDown);
      }
    }, 5000);
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
    </Modal>
  );
}
