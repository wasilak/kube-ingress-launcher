# Design Document: Kubernetes Ingress Desktop Search

## Overview

This design describes a standalone Tauri-based macOS desktop application for searching Kubernetes ingress resources. The application provides a Spotlight-like interface accessible via a global keyboard shortcut (Cmd+Shift+K), running as a menu bar utility without a dock icon.

The application uses Tauri v2 with a React + TypeScript frontend and Rust backend. The Rust backend handles all Kubernetes API communication using kube-rs, performs data transformation, and manages background refresh tasks. The frontend provides a compact search interface with Mantine UI components and native macOS vibrancy effects.

### Key Design Decisions

1. **Tauri v2 Framework**: Lightweight alternative to Electron, using Rust for backend and web technologies for UI
2. **kube-rs for Kubernetes**: Official Rust Kubernetes client with async support via tokio
3. **Periodic Refresh**: 60-second polling instead of watch connections for simplicity
4. **In-Memory Cache**: Tauri state management with Arc<RwLock<T>> for thread-safe access
5. **window-vibrancy**: Native macOS blur effects for authentic Spotlight appearance
6. **Auto-save Settings**: Tauri store plugin for immediate persistence
7. **React + Mantine UI**: Familiar web technologies with excellent TypeScript support

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     macOS Desktop                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Tauri Application                         │ │
│  │                                                        │ │
│  │  ┌──────────────────┐      ┌──────────────────────┐  │ │
│  │  │   Frontend (UI)  │      │   Backend (Rust)     │  │ │
│  │  │                  │      │                      │  │ │
│  │  │  React + TS      │◄────►│  Tauri Commands      │  │ │
│  │  │  Mantine UI      │ IPC  │  State Management    │  │ │
│  │  │  Search Input    │      │  K8s Client          │  │ │
│  │  │  Ingress List    │      │  Background Refresh  │  │ │
│  │  │  Settings Dialog │      │  Settings Store      │  │ │
│  │  └──────────────────┘      └──────────────────────┘  │ │
│  │                                      │                │ │
│  │                                      ▼                │ │
│  │                            ┌──────────────────┐      │ │
│  │                            │  Tauri Plugins   │      │ │
│  │                            │  - global-shortcut│     │ │
│  │                            │  - shell         │      │ │
│  │                            │  - store         │      │ │
│  │                            │  - window-vibrancy│     │ │
│  │                            └──────────────────┘      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                      │                       │
│                                      ▼                       │
│                          ┌────────────────────┐             │
│                          │  macOS System APIs │             │
│                          │  - Menu Bar        │             │
│                          │  - Global Shortcuts│             │
│                          │  - Login Items     │             │
│                          │  - Default Browser │             │
│                          └────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                          ┌────────────────────┐
                          │ Kubernetes Cluster │
                          │  (via kubeconfig)  │
                          └────────────────────┘
```

## Architecture

### Project Structure

```
kube-ingress-desktop/
├── package.json              # Frontend dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── vite.config.ts            # Vite bundler configuration
├── src/                      # React frontend source
│   ├── main.tsx             # React entry point
│   ├── App.tsx              # Main app component
│   ├── components/          # React components
│   │   ├── SearchInput.tsx
│   │   ├── IngressList.tsx
│   │   ├── IngressItem.tsx
│   │   ├── ErrorBanner.tsx
│   │   └── SettingsDialog.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useIngresses.ts
│   │   ├── useSearch.ts
│   │   └── useSettings.ts
│   ├── types/               # TypeScript type definitions
│   │   └── ingress.ts
│   └── styles/              # CSS files
│       └── index.css
├── src-tauri/               # Rust backend source
│   ├── Cargo.toml          # Rust dependencies
│   ├── tauri.conf.json     # Tauri configuration
│   ├── build.rs            # Build script
│   ├── src/
│   │   ├── main.rs         # Rust entry point
│   │   ├── commands/       # Tauri command handlers
│   │   │   ├── mod.rs
│   │   │   ├── ingresses.rs
│   │   │   ├── settings.rs
│   │   │   └── kubernetes.rs
│   │   ├── k8s/            # Kubernetes client
│   │   │   ├── mod.rs
│   │   │   ├── client.rs
│   │   │   └── transform.rs
│   │   ├── state/          # Application state
│   │   │   ├── mod.rs
│   │   │   └── app_state.rs
│   │   ├── refresh/        # Background refresh
│   │   │   ├── mod.rs
│   │   │   └── task.rs
│   │   ├── settings/       # Settings management
│   │   │   ├── mod.rs
│   │   │   └── store.rs
│   │   └── error.rs        # Error types
│   ├── icons/              # Application icons
│   │   └── icon.png
│   └── Info.plist          # macOS app metadata
├── tests/                   # Frontend tests
│   └── components/
└── README.md               # Project documentation
```


## Components and Interfaces

### Frontend Components

#### App Component

The root component that orchestrates the entire UI:

```typescript
// src/App.tsx
import { useState, useEffect } from 'react';
import { Stack } from '@mantine/core';
import { SearchInput } from './components/SearchInput';
import { IngressList } from './components/IngressList';
import { ErrorBanner } from './components/ErrorBanner';
import { SettingsDialog } from './components/SettingsDialog';
import { useIngresses } from './hooks/useIngresses';
import { useSearch } from './hooks/useSearch';

export function App() {
  const { ingresses, loading, error, lastUpdated } = useIngresses();
  const { searchTerm, setSearchTerm, filteredIngresses } = useSearch(ingresses);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="app-container">
      <Stack gap="xs" p="md">
        {error && <ErrorBanner error={error} />}
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          loading={loading}
        />
        <IngressList
          ingresses={filteredIngresses}
          onSelect={handleIngressSelect}
        />
      </Stack>
      <SettingsDialog
        opened={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
```

#### SearchInput Component

Auto-focused input with debouncing:

```typescript
// src/components/SearchInput.tsx
import { TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
}

export function SearchInput({ value, onChange, loading }: SearchInputProps) {
  const [debouncedValue] = useDebouncedValue(value, 150);

  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue]);

  return (
    <TextInput
      placeholder="Search ingresses..."
      leftSection={<IconSearch size={16} />}
      autoFocus
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      rightSection={loading ? <Loader size="xs" /> : null}
    />
  );
}
```

#### IngressList Component

Virtualized list for performance:

```typescript
// src/components/IngressList.tsx
import { Stack, Text } from '@mantine/core';
import { IngressItem } from './IngressItem';
import { IngressData } from '../types/ingress';

interface IngressListProps {
  ingresses: IngressData[];
  onSelect: (ingress: IngressData) => void;
}

export function IngressList({ ingresses, onSelect }: IngressListProps) {
  if (ingresses.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No ingresses found
      </Text>
    );
  }

  const displayedIngresses = ingresses.slice(0, 50);
  const remaining = ingresses.length - 50;

  return (
    <Stack gap="xs" style={{ maxHeight: '400px', overflowY: 'auto' }}>
      {displayedIngresses.map((ingress) => (
        <IngressItem
          key={ingress.id}
          ingress={ingress}
          onSelect={() => onSelect(ingress)}
        />
      ))}
      {remaining > 0 && (
        <Text c="dimmed" size="sm" ta="center">
          {remaining} more results...
        </Text>
      )}
    </Stack>
  );
}
```

#### IngressItem Component

Displays ingress information with expandable URLs:

```typescript
// src/components/IngressItem.tsx
import { useState } from 'react';
import { Stack, Group, Text, Badge, Button } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import { IngressData } from '../types/ingress';
import { invoke } from '@tauri-apps/api/core';

interface IngressItemProps {
  ingress: IngressData;
  onSelect: () => void;
}

export function IngressItem({ ingress, onSelect }: IngressItemProps) {
  const [expanded, setExpanded] = useState(false);

  const handleUrlClick = async (url: string) => {
    await invoke('open_url', { url });
  };

  return (
    <div
      className="ingress-item"
      onClick={() => setExpanded(!expanded)}
      style={{
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        cursor: 'pointer',
      }}
    >
      <Group justify="space-between">
        <Stack gap={4}>
          <Group gap="xs">
            <Text fw={500}>{ingress.name}</Text>
            <Badge size="sm" variant="light">
              {ingress.namespace}
            </Badge>
            {ingress.tls && <Badge size="sm" color="green">TLS</Badge>}
          </Group>
          <Text size="sm" c="dimmed">
            {ingress.hosts.join(', ')}
          </Text>
        </Stack>
      </Group>

      {expanded && ingress.urls.length > 0 && (
        <Stack gap="xs" mt="sm">
          {ingress.urls.map((url) => (
            <Button
              key={url}
              variant="subtle"
              size="xs"
              leftSection={<IconExternalLink size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                handleUrlClick(url);
              }}
            >
              {url}
            </Button>
          ))}
        </Stack>
      )}
    </div>
  );
}
```

#### ErrorBanner Component

Displays errors with copy functionality:

```typescript
// src/components/ErrorBanner.tsx
import { Alert, Button, Group, Text } from '@mantine/core';
import { IconAlertCircle, IconCopy } from '@tabler/icons-react';

interface ErrorBannerProps {
  error: {
    message: string;
    details?: string;
    timestamp: string;
  };
}

export function ErrorBanner({ error }: ErrorBannerProps) {
  const handleCopyError = () => {
    const errorText = `Error: ${error.message}\nDetails: ${error.details || 'N/A'}\nTime: ${error.timestamp}`;
    navigator.clipboard.writeText(errorText);
  };

  return (
    <Alert color="red" title="Error" icon={<IconAlertCircle />}>
      <Group justify="space-between">
        <Text size="sm">{error.message}</Text>
        <Button
          size="xs"
          variant="light"
          leftSection={<IconCopy size={14} />}
          onClick={handleCopyError}
        >
          Copy Error
        </Button>
      </Group>
    </Alert>
  );
}
```

#### SettingsDialog Component

Configuration interface:

```typescript
// src/components/SettingsDialog.tsx
import { Modal, Stack, TextInput, NumberInput, Switch, Select, Button, Text } from '@mantine/core';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface SettingsDialogProps {
  opened: boolean;
  onClose: () => void;
}

export function SettingsDialog({ opened, onClose }: SettingsDialogProps) {
  const [settings, setSettings] = useState({
    globalShortcut: 'CmdOrCtrl+Shift+K',
    refreshIntervalSecs: 60,
    autostart: false,
    kubeContext: '',
  });
  const [contexts, setContexts] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (opened) {
      loadSettings();
      loadContexts();
    }
  }, [opened]);

  const loadSettings = async () => {
    const loaded = await invoke('get_settings');
    setSettings(loaded);
  };

  const loadContexts = async () => {
    const ctxs = await invoke('get_contexts');
    setContexts(ctxs);
  };

  const handleSettingChange = async (key: string, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await invoke('update_settings', { settings: updated });
  };

  const handleRecordShortcut = () => {
    setRecording(true);
    // Keyboard event listener would be added here
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Settings" size="md">
      <Stack gap="md">
        <div>
          <Text size="sm" fw={500} mb="xs">Global Shortcut</Text>
          <Group>
            <TextInput
              value={settings.globalShortcut}
              readOnly
              style={{ flex: 1 }}
            />
            <Button
              onClick={handleRecordShortcut}
              variant={recording ? 'filled' : 'light'}
            >
              {recording ? 'Press keys...' : 'Record'}
            </Button>
          </Group>
        </div>

        <NumberInput
          label="Refresh Interval (seconds)"
          value={settings.refreshIntervalSecs}
          onChange={(val) => handleSettingChange('refreshIntervalSecs', val)}
          min={10}
          max={3600}
        />

        <Switch
          label="Autostart with system"
          checked={settings.autostart}
          onChange={(e) => handleSettingChange('autostart', e.currentTarget.checked)}
        />

        <Select
          label="Kubernetes Context"
          data={contexts}
          value={settings.kubeContext}
          onChange={(val) => handleSettingChange('kubeContext', val)}
        />
      </Stack>
    </Modal>
  );
}
```

### Custom Hooks

#### useIngresses Hook

Manages ingress data fetching:

```typescript
// src/hooks/useIngresses.ts
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { IngressData } from '../types/ingress';

export function useIngresses() {
  const [ingresses, setIngresses] = useState<IngressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetchIngresses();

    // Listen for refresh events from backend
    const unlisten = listen('ingresses-updated', () => {
      fetchIngresses();
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const fetchIngresses = async () => {
    try {
      const response = await invoke('get_ingresses');
      setIngresses(response.ingresses);
      setError(response.error);
      setLastUpdated(response.lastUpdated);
    } catch (err) {
      setError({ message: 'Failed to fetch ingresses', details: err.toString() });
    } finally {
      setLoading(false);
    }
  };

  return { ingresses, loading, error, lastUpdated };
}
```

#### useSearch Hook

Handles search filtering:

```typescript
// src/hooks/useSearch.ts
import { useState, useMemo } from 'react';
import { IngressData } from '../types/ingress';

export function useSearch(ingresses: IngressData[]) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIngresses = useMemo(() => {
    if (!searchTerm) return ingresses;

    const term = searchTerm.toLowerCase();
    return ingresses.filter((ingress) =>
      ingress.name.toLowerCase().includes(term) ||
      ingress.namespace.toLowerCase().includes(term) ||
      ingress.hosts.some((host) => host.toLowerCase().includes(term)) ||
      ingress.urls.some((url) => url.toLowerCase().includes(term))
    );
  }, [ingresses, searchTerm]);

  return { searchTerm, setSearchTerm, filteredIngresses };
}
```


### Rust Backend Components

#### Main Entry Point

```rust
// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, State};
use std::sync::Arc;
use tokio::sync::RwLock;

mod commands;
mod k8s;
mod state;
mod refresh;
mod settings;
mod error;

use state::AppState;
use commands::{ingresses, settings as settings_cmd, kubernetes};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            // Initialize application state
            let app_state = AppState::new();
            app.manage(app_state.clone());

            // Setup window vibrancy
            if let Some(window) = app.get_webview_window("main") {
                #[cfg(target_os = "macos")]
                {
                    use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                    apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
                        .expect("Failed to apply vibrancy");
                }
            }

            // Setup menu bar tray
            setup_tray(app)?;

            // Register global shortcut
            setup_global_shortcut(app)?;

            // Start background refresh task
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                refresh::task::start_refresh_task(app_handle).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            ingresses::get_ingresses,
            ingresses::open_url,
            settings_cmd::get_settings,
            settings_cmd::update_settings,
            kubernetes::get_contexts,
            kubernetes::switch_context,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::menu::{Menu, MenuItem};
    use tauri::tray::{TrayIconBuilder, TrayIconEvent};

    let show_item = MenuItem::with_id(app, "show", "Show (⌘⇧K)", true, None::<&str>)?;
    let options_item = MenuItem::with_id(app, "options", "Options...", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&show_item, &options_item, &quit_item])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "options" => {
                    // Emit event to open settings dialog
                    let _ = app.emit("open-settings", ());
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}

fn setup_global_shortcut(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

    let shortcut = "CmdOrCtrl+Shift+K".parse::<Shortcut>()?;

    app.global_shortcut().on_shortcut(shortcut, |app, _shortcut, _event| {
        if let Some(window) = app.get_webview_window("main") {
            if window.is_visible().unwrap_or(false) {
                let _ = window.hide();
            } else {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    })?;

    Ok(())
}
```

#### Application State

```rust
// src-tauri/src/state/app_state.rs
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IngressData {
    pub id: String,
    pub name: String,
    pub namespace: String,
    pub hosts: Vec<String>,
    pub paths: Vec<String>,
    pub urls: Vec<String>,
    pub annotations: std::collections::HashMap<String, String>,
    pub creation_timestamp: String,
    pub tls: bool,
    pub status: String,
    pub labels: Option<std::collections::HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorInfo {
    pub message: String,
    pub details: Option<String>,
    pub timestamp: String,
}

#[derive(Clone)]
pub struct AppState {
    pub ingresses: Arc<RwLock<Vec<IngressData>>>,
    pub last_error: Arc<RwLock<Option<ErrorInfo>>>,
    pub last_updated: Arc<RwLock<Option<DateTime<Utc>>>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            ingresses: Arc::new(RwLock::new(Vec::new())),
            last_error: Arc::new(RwLock::new(None)),
            last_updated: Arc::new(RwLock::new(None)),
        }
    }
}
```

#### Kubernetes Client

```rust
// src-tauri/src/k8s/client.rs
use kube::{Client, Api, Config};
use k8s_openapi::api::networking::v1::Ingress;
use crate::error::AppError;

pub struct K8sClient {
    client: Client,
    config: Config,
}

impl K8sClient {
    pub async fn new() -> Result<Self, AppError> {
        let config = Config::infer().await
            .map_err(|e| AppError::KubernetesError(format!("Failed to load kubeconfig: {}", e)))?;
        
        let client = Client::try_from(config.clone())
            .map_err(|e| AppError::KubernetesError(format!("Failed to create client: {}", e)))?;

        Ok(Self { client, config })
    }

    pub async fn list_ingresses(&self) -> Result<Vec<Ingress>, AppError> {
        let ingresses: Api<Ingress> = Api::all(self.client.clone());
        
        let list = ingresses.list(&Default::default()).await
            .map_err(|e| AppError::KubernetesError(format!("Failed to list ingresses: {}", e)))?;

        Ok(list.items)
    }

    pub fn get_current_context(&self) -> String {
        self.config.cluster_url.to_string()
    }

    pub async fn get_contexts() -> Result<Vec<String>, AppError> {
        let config = kube::Config::infer().await
            .map_err(|e| AppError::KubernetesError(format!("Failed to load kubeconfig: {}", e)))?;

        // Parse kubeconfig file to get context names
        // This is simplified - actual implementation would parse ~/.kube/config
        Ok(vec!["default".to_string()])
    }
}
```

#### Ingress Transformation

```rust
// src-tauri/src/k8s/transform.rs
use k8s_openapi::api::networking::v1::Ingress;
use crate::state::IngressData;
use std::collections::HashMap;

pub fn transform_ingress(k8s_ingress: &Ingress) -> IngressData {
    let metadata = k8s_ingress.metadata.clone();
    let spec = k8s_ingress.spec.clone().unwrap_or_default();

    let name = metadata.name.unwrap_or_else(|| "unknown".to_string());
    let namespace = metadata.namespace.unwrap_or_else(|| "default".to_string());
    let id = metadata.uid.unwrap_or_else(|| format!("{}-{}", namespace, name));

    let mut hosts = Vec::new();
    let mut paths = Vec::new();
    let mut urls = Vec::new();

    // Extract hosts and paths from rules
    if let Some(rules) = spec.rules {
        for rule in rules {
            if let Some(host) = rule.host {
                hosts.push(host.clone());

                if let Some(http) = rule.http {
                    for path in http.paths {
                        let path_str = path.path.unwrap_or_else(|| "/".to_string());
                        paths.push(path_str.clone());

                        // Construct URL
                        let protocol = if spec.tls.is_some() { "https" } else { "http" };
                        urls.push(format!("{}://{}{}", protocol, host, path_str));
                    }
                }
            }
        }
    }

    // Extract additional hosts from TLS
    if let Some(tls_configs) = &spec.tls {
        for tls in tls_configs {
            if let Some(tls_hosts) = &tls.hosts {
                for host in tls_hosts {
                    if !hosts.contains(host) {
                        hosts.push(host.clone());
                    }
                }
            }
        }
    }

    let has_tls = spec.tls.is_some() && !spec.tls.as_ref().unwrap().is_empty();

    // Filter annotations
    let annotations = filter_annotations(metadata.annotations.unwrap_or_default());
    let labels = metadata.labels;

    let creation_timestamp = metadata.creation_timestamp
        .map(|ts| ts.0.to_rfc3339())
        .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());

    IngressData {
        id,
        name,
        namespace,
        hosts,
        paths,
        urls,
        annotations,
        creation_timestamp,
        tls: has_tls,
        status: "unknown".to_string(),
        labels,
    }
}

fn filter_annotations(annotations: HashMap<String, String>) -> HashMap<String, String> {
    annotations
        .into_iter()
        .filter(|(key, _)| {
            !key.starts_with("kubectl.kubernetes.io/")
                && !key.starts_with("deployment.kubernetes.io/")
                && !key.starts_with("helm.sh/")
                && !key.starts_with("meta.helm.sh/")
        })
        .collect()
}
```

#### Background Refresh Task

```rust
// src-tauri/src/refresh/task.rs
use tokio::time::{interval, Duration};
use crate::k8s::client::K8sClient;
use crate::k8s::transform::transform_ingress;
use crate::state::{AppState, ErrorInfo};
use chrono::Utc;

pub async fn start_refresh_task(app_handle: tauri::AppHandle) {
    // Get settings for refresh interval
    let refresh_interval_secs = 60; // Default, should load from settings

    let mut interval = interval(Duration::from_secs(refresh_interval_secs));

    // Initial fetch
    if let Err(e) = fetch_and_update(&app_handle).await {
        eprintln!("Initial fetch failed: {}", e);
    }

    loop {
        interval.tick().await;

        if let Err(e) = fetch_and_update(&app_handle).await {
            eprintln!("Background refresh failed: {}", e);
        }
    }
}

async fn fetch_and_update(app_handle: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let state = app_handle.state::<AppState>();

    match K8sClient::new().await {
        Ok(client) => {
            match client.list_ingresses().await {
                Ok(k8s_ingresses) => {
                    let ingresses: Vec<_> = k8s_ingresses
                        .iter()
                        .map(transform_ingress)
                        .collect();

                    // Update state
                    let mut state_ingresses = state.ingresses.write().await;
                    *state_ingresses = ingresses;

                    let mut last_updated = state.last_updated.write().await;
                    *last_updated = Some(Utc::now());

                    let mut last_error = state.last_error.write().await;
                    *last_error = None;

                    // Emit event to frontend
                    let _ = app_handle.emit("ingresses-updated", ());

                    Ok(())
                }
                Err(e) => {
                    let error_info = ErrorInfo {
                        message: format!("Failed to fetch ingresses: {}", e),
                        details: Some(format!("{:?}", e)),
                        timestamp: Utc::now().to_rfc3339(),
                    };

                    let mut last_error = state.last_error.write().await;
                    *last_error = Some(error_info);

                    Err(Box::new(e))
                }
            }
        }
        Err(e) => {
            let error_info = ErrorInfo {
                message: format!("Failed to connect to Kubernetes: {}", e),
                details: Some(format!("{:?}", e)),
                timestamp: Utc::now().to_rfc3339(),
            };

            let mut last_error = state.last_error.write().await;
            *last_error = Some(error_info);

            Err(Box::new(e))
        }
    }
}
```

#### Tauri Commands

```rust
// src-tauri/src/commands/ingresses.rs
use tauri::State;
use serde::{Deserialize, Serialize};
use crate::state::{AppState, IngressData, ErrorInfo};

#[derive(Debug, Serialize, Deserialize)]
pub struct IngressResponse {
    pub ingresses: Vec<IngressData>,
    pub error: Option<ErrorInfo>,
    pub last_updated: Option<String>,
}

#[tauri::command]
pub async fn get_ingresses(state: State<'_, AppState>) -> Result<IngressResponse, String> {
    let ingresses = state.ingresses.read().await;
    let last_error = state.last_error.read().await;
    let last_updated = state.last_updated.read().await;

    Ok(IngressResponse {
        ingresses: ingresses.clone(),
        error: last_error.clone(),
        last_updated: last_updated.map(|dt| dt.to_rfc3339()),
    })
}

#[tauri::command]
pub async fn open_url(url: String) -> Result<(), String> {
    use tauri_plugin_shell::ShellExt;
    
    // This would be called with the app handle in actual implementation
    // For now, simplified version
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }

    Ok(())
}
```

```rust
// src-tauri/src/commands/settings.rs
use tauri::{AppHandle, State};
use serde::{Deserialize, Serialize};
use crate::settings::store::{load_settings, save_settings};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub global_shortcut: String,
    pub refresh_interval_secs: u64,
    pub autostart: bool,
    pub kube_context: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            global_shortcut: "CmdOrCtrl+Shift+K".to_string(),
            refresh_interval_secs: 60,
            autostart: false,
            kube_context: String::new(),
        }
    }
}

#[tauri::command]
pub async fn get_settings(app: AppHandle) -> Result<Settings, String> {
    load_settings(&app).await
        .map_err(|e| format!("Failed to load settings: {}", e))
}

#[tauri::command]
pub async fn update_settings(
    app: AppHandle,
    settings: Settings,
) -> Result<(), String> {
    // Validate settings
    if settings.refresh_interval_secs < 10 || settings.refresh_interval_secs > 3600 {
        return Err("Refresh interval must be between 10 and 3600 seconds".to_string());
    }

    // Save settings
    save_settings(&app, &settings).await
        .map_err(|e| format!("Failed to save settings: {}", e))?;

    // Apply settings (update shortcut, refresh interval, etc.)
    // This would involve updating the global shortcut registration
    // and restarting the refresh task with new interval

    Ok(())
}
```

#### Error Types

```rust
// src-tauri/src/error.rs
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Kubernetes error: {0}")]
    KubernetesError(String),

    #[error("Settings error: {0}")]
    SettingsError(String),

    #[error("Permission error: {0}")]
    PermissionError(String),

    #[error("System error: {0}")]
    SystemError(String),
}

impl From<AppError> for String {
    fn from(error: AppError) -> Self {
        error.to_string()
    }
}
```


## Data Models

### TypeScript Types

```typescript
// src/types/ingress.ts
export interface IngressData {
  id: string;
  name: string;
  namespace: string;
  hosts: string[];
  paths: string[];
  urls: string[];
  annotations: Record<string, string>;
  creationTimestamp: string;
  tls: boolean;
  status: 'ready' | 'pending' | 'error' | 'unknown';
  labels?: Record<string, string>;
}

export interface ErrorInfo {
  message: string;
  details?: string;
  timestamp: string;
}

export interface Settings {
  globalShortcut: string;
  refreshIntervalSecs: number;
  autostart: boolean;
  kubeContext: string;
}

export interface IngressResponse {
  ingresses: IngressData[];
  error: ErrorInfo | null;
  lastUpdated: string | null;
}
```

### Rust Types

```rust
// Defined in src-tauri/src/state/app_state.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IngressData {
    pub id: String,
    pub name: String,
    pub namespace: String,
    pub hosts: Vec<String>,
    pub paths: Vec<String>,
    pub urls: Vec<String>,
    pub annotations: HashMap<String, String>,
    pub creation_timestamp: String,
    pub tls: bool,
    pub status: String,
    pub labels: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorInfo {
    pub message: String,
    pub details: Option<String>,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub global_shortcut: String,
    pub refresh_interval_secs: u64,
    pub autostart: bool,
    pub kube_context: String,
}
```

## Theme Support

### Theme Configuration

The application supports three theme modes: light, dark, and system. The theme preference is stored in settings and persists across restarts.

**Settings Structure:**

```rust
// src-tauri/src/commands/settings.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub global_shortcut: String,
    pub refresh_interval_secs: u64,
    pub autostart: bool,
    pub kube_context: String,
    pub theme: String, // "light", "dark", or "system"
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            global_shortcut: "CmdOrCtrl+Shift+K".to_string(),
            refresh_interval_secs: 60,
            autostart: false,
            kube_context: String::new(),
            theme: "system".to_string(), // Default to system theme
        }
    }
}
```

### Theme Detection and Application

**Frontend Implementation:**

```typescript
// src/hooks/useTheme.ts
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { MantineColorScheme } from '@mantine/core';

export function useTheme() {
  const [colorScheme, setColorScheme] = useState<MantineColorScheme>('dark');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    // Load saved theme preference
    loadTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeMode === 'system') {
        setColorScheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  const loadTheme = async () => {
    try {
      const settings = await invoke<Settings>('get_settings');
      const mode = settings.theme as 'light' | 'dark' | 'system';
      setThemeMode(mode);

      if (mode === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setColorScheme(isDark ? 'dark' : 'light');
      } else {
        setColorScheme(mode);
      }
    } catch (err) {
      console.error('Failed to load theme:', err);
    }
  };

  const changeTheme = async (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);

    if (mode === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setColorScheme(isDark ? 'dark' : 'light');
    } else {
      setColorScheme(mode);
    }

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
```

**App Integration:**

```typescript
// src/App.tsx
import { MantineProvider } from '@mantine/core';
import { useTheme } from './hooks/useTheme';

export function App() {
  const { colorScheme } = useTheme();

  return (
    <MantineProvider theme={{ colorScheme }}>
      {/* App content */}
    </MantineProvider>
  );
}
```

**Settings Dialog Integration:**

```typescript
// src/components/SettingsDialog.tsx
import { Select } from '@mantine/core';
import { useTheme } from '../hooks/useTheme';

export function SettingsDialog({ opened, onClose }: SettingsDialogProps) {
  const { themeMode, changeTheme } = useTheme();

  return (
    <Modal opened={opened} onClose={onClose} title="Settings">
      <Stack gap="md">
        {/* Other settings */}
        
        <Select
          label="Theme"
          data={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ]}
          value={themeMode}
          onChange={(value) => changeTheme(value as 'light' | 'dark' | 'system')}
        />
      </Stack>
    </Modal>
  );
}
```

## Search Window UX Improvements

### Window Size Increase

The search window dimensions are increased by 20% for better visibility:

**Configuration:**

```json
// src-tauri/tauri.conf.json
{
  "app": {
    "windows": [
      {
        "title": "Kube Ingress Search",
        "width": 720,  // Increased from 600 (20% larger)
        "height": 480, // Increased from 400 (20% larger)
        "resizable": true,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "visible": false,
        "center": true
      }
    ]
  }
}
```

### Auto-Select Search Text

When the window opens, the search text is automatically selected so users can immediately start typing to replace it:

```typescript
// src/components/SearchInput.tsx
import { useEffect, useRef } from 'react';
import { TextInput } from '@mantine/core';
import { listen } from '@tauri-apps/api/event';

export function SearchInput({ value, onChange, loading }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Select text when component mounts (window opens)
    if (inputRef.current) {
      inputRef.current.select();
    }

    // Listen for window show events to select text
    const unlisten = listen('window-shown', () => {
      if (inputRef.current) {
        inputRef.current.select();
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return (
    <TextInput
      ref={inputRef}
      placeholder="Search ingresses..."
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      autoFocus
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      data-gramm="false"
      data-gramm_editor="false"
      data-enable-grammarly="false"
    />
  );
}
```

### Disable Autocomplete and Grammar Suggestions

The search input disables all macOS autocomplete, autocorrect, spell checking, and third-party grammar suggestions:

**HTML Attributes:**

- `autoComplete="off"` - Disables browser autocomplete
- `autoCorrect="off"` - Disables macOS autocorrect
- `spellCheck={false}` - Disables spell checking
- `data-gramm="false"` - Disables Grammarly
- `data-gramm_editor="false"` - Additional Grammarly disable
- `data-enable-grammarly="false"` - Additional Grammarly disable

### Auto-Close on Focus Loss

The window automatically closes when the user clicks outside or switches to another application. This is already implemented in the `useWindowBehavior` hook with a 100ms delay:

```typescript
// src/hooks/useWindowBehavior.ts
import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function useWindowBehavior() {
  useEffect(() => {
    const window = getCurrentWindow();
    let blurTimeout: NodeJS.Timeout;

    const handleBlur = () => {
      // Hide window after 100ms delay
      blurTimeout = setTimeout(() => {
        window.hide();
      }, 100);
    };

    const handleFocus = () => {
      // Cancel hide if window regains focus
      if (blurTimeout) {
        clearTimeout(blurTimeout);
      }
    };

    window.listen('blur', handleBlur);
    window.listen('focus', handleFocus);

    return () => {
      if (blurTimeout) {
        clearTimeout(blurTimeout);
      }
    };
  }, []);
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Ingress Transformation Correctness

*For any* valid Kubernetes Ingress object (networking.k8s.io/v1), transforming it to IngressData should correctly extract: name from metadata.name, namespace from metadata.namespace, hosts from spec.rules[].host and spec.tls[].hosts (deduplicated), paths from spec.rules[].http.paths[].path, TLS status from presence of spec.tls, and annotations/labels from metadata (with auto-generated annotations filtered out).

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8**

### Property 2: Search Filtering Correctness

*For any* list of ingresses and any search term (case-insensitive), filtering should return exactly the ingresses where the search term appears as a substring in name, namespace, any host, or any URL, and should not return ingresses where the term doesn't appear in any of these fields.

**Validates: Requirements 7.3**

### Property 3: Refresh Interval Validation

*For any* numeric input for refresh interval, if the value is less than 10 or greater than 3600, validation should reject it with an error message, and if the value is between 10 and 3600 (inclusive), validation should accept it.

**Validates: Requirements 9.10**

### Property 4: Settings Persistence

*For any* valid Settings object (with valid shortcut, refresh interval 10-3600, autostart boolean, and context string), after saving the settings to disk and reloading them, the loaded settings should be equal to the saved settings.

**Validates: Requirements 9.18, 9.19, 9.20**

### Property 5: Error Resilience

*For any* error that occurs during Kubernetes API calls, background refresh, window operations, or settings operations, the application should catch the error, log it appropriately, update error state if applicable, and continue running without crashing or becoming unresponsive.

**Validates: Requirements 11.7**

## Error Handling

### Error Categories

1. **Kubernetes API Errors**
   - Connection failures (cluster unreachable)
   - Authentication errors (invalid credentials)
   - Authorization errors (insufficient RBAC permissions)
   - Timeout errors
   - Invalid kubeconfig

2. **Application Errors**
   - Settings validation errors
   - Permission errors (accessibility, autostart)
   - Window management errors
   - Shortcut registration errors

3. **System Errors**
   - File system errors (settings persistence)
   - Network errors
   - macOS system integration errors

### Error Handling Strategy

**Rust Backend Error Handling:**

All Tauri commands return `Result<T, String>` where the error string is a user-friendly message. Internal errors are logged to console and converted to user-friendly messages before returning to frontend.

**Retry Logic:**

```rust
async fn fetch_with_retry<T, F, Fut>(
    operation: F,
    max_attempts: u32,
) -> Result<T, AppError>
where
    F: Fn() -> Fut,
    Fut: Future<Output = Result<T, AppError>>,
{
    let mut attempts = 0;
    let mut delay = Duration::from_millis(100);
    
    loop {
        attempts += 1;
        
        match operation().await {
            Ok(result) => return Ok(result),
            Err(e) if attempts >= max_attempts => return Err(e),
            Err(_) => {
                tokio::time::sleep(delay).await;
                delay = delay.saturating_mul(2).min(Duration::from_secs(5));
            }
        }
    }
}
```

**Graceful Degradation:**

- **Kubernetes API Unavailable**: Display last cached ingresses with error banner
- **Permission Denied**: Disable affected features and show explanation in menu tooltip
- **Settings Load Failure**: Use default settings and log error
- **Window Management Error**: Log error but continue running
- **Shortcut Registration Failure**: Allow manual window opening via menu

### Error Display

Frontend displays errors using the ErrorBanner component with:
- Clear error message
- "Copy Error" button for troubleshooting
- Timestamp of when error occurred
- Optional details for technical users

## Testing Strategy

### Dual Testing Approach

The project uses both unit tests and property-based tests:

**Unit Tests:**
- Specific examples and edge cases
- UI component behavior
- Integration between components
- Error conditions
- macOS-specific functionality

**Property-Based Tests:**
- Universal properties across all inputs
- Ingress transformation correctness
- Search filtering correctness
- Settings validation and persistence
- Error handling resilience

### Testing by Component

#### Rust Backend Tests

**Unit Tests:**

```rust
// src-tauri/src/k8s/transform.rs
#[cfg(test)]
mod tests {
    use super::*;
    use k8s_openapi::api::networking::v1::Ingress;

    #[test]
    fn test_transform_ingress_basic() {
        let k8s_ingress = create_test_ingress("test", "default", vec!["example.com"]);
        let result = transform_ingress(&k8s_ingress);

        assert_eq!(result.name, "test");
        assert_eq!(result.namespace, "default");
        assert_eq!(result.hosts, vec!["example.com"]);
    }

    #[test]
    fn test_filter_annotations() {
        let mut annotations = HashMap::new();
        annotations.insert("kubectl.kubernetes.io/last-applied".to_string(), "{}".to_string());
        annotations.insert("custom.annotation".to_string(), "value".to_string());

        let filtered = filter_annotations(annotations);

        assert!(!filtered.contains_key("kubectl.kubernetes.io/last-applied"));
        assert_eq!(filtered.get("custom.annotation"), Some(&"value".to_string()));
    }
}
```

**Property Tests:**

```rust
// src-tauri/src/k8s/transform.rs
#[cfg(test)]
mod proptests {
    use super::*;
    use proptest::prelude::*;

    // Feature: kube-ingress-desktop, Property 1: Ingress Transformation Correctness
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]

        #[test]
        fn test_transform_preserves_name_and_namespace(
            name in "[a-z]{1,20}",
            namespace in "[a-z]{1,20}",
        ) {
            let k8s_ingress = create_ingress_with_metadata(&name, &namespace);
            let result = transform_ingress(&k8s_ingress);

            prop_assert_eq!(&result.name, &name);
            prop_assert_eq!(&result.namespace, &namespace);
        }

        #[test]
        fn test_transform_extracts_all_hosts(
            hosts in prop::collection::vec("[a-z]{1,10}\\.[a-z]{2,5}", 1..5)
        ) {
            let k8s_ingress = create_ingress_with_hosts(&hosts);
            let result = transform_ingress(&k8s_ingress);

            for host in &hosts {
                prop_assert!(result.hosts.contains(host));
            }
        }
    }
}
```

#### Frontend Tests

**Component Tests:**

```typescript
// tests/components/IngressList.test.tsx
import { render, screen } from '@testing-library/react';
import { IngressList } from '../../src/components/IngressList';

describe('IngressList', () => {
  it('should display all ingresses', () => {
    const ingresses = [
      createTestIngress('ing1', 'default', ['example.com']),
      createTestIngress('ing2', 'prod', ['api.example.com']),
    ];

    render(<IngressList ingresses={ingresses} onSelect={() => {}} />);

    expect(screen.getByText('ing1')).toBeInTheDocument();
    expect(screen.getByText('ing2')).toBeInTheDocument();
  });

  it('should show "No ingresses found" when list is empty', () => {
    render(<IngressList ingresses={[]} onSelect={() => {}} />);
    expect(screen.getByText('No ingresses found')).toBeInTheDocument();
  });
});
```

**Property Tests:**

```typescript
// tests/search.test.ts
import fc from 'fast-check';
import { filterIngresses } from '../src/utils/search';

// Feature: kube-ingress-desktop, Property 2: Search Filtering Correctness
describe('Search Filtering', () => {
  it('should filter correctly for any search term', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 20 }),
          namespace: fc.string({ minLength: 1, maxLength: 20 }),
          hosts: fc.array(fc.domain()),
          urls: fc.array(fc.webUrl()),
          // ... other fields
        })),
        fc.string(),
        (ingresses, searchTerm) => {
          const filtered = filterIngresses(ingresses, searchTerm);
          const term = searchTerm.toLowerCase();

          // All filtered ingresses should match
          for (const ing of filtered) {
            const matches =
              ing.name.toLowerCase().includes(term) ||
              ing.namespace.toLowerCase().includes(term) ||
              ing.hosts.some(h => h.toLowerCase().includes(term)) ||
              ing.urls.some(u => u.toLowerCase().includes(term));
            expect(matches).toBe(true);
          }

          // No non-matching ingresses should be included
          for (const ing of ingresses) {
            const matches =
              ing.name.toLowerCase().includes(term) ||
              ing.namespace.toLowerCase().includes(term) ||
              ing.hosts.some(h => h.toLowerCase().includes(term)) ||
              ing.urls.some(u => u.toLowerCase().includes(term));
            
            if (matches) {
              expect(filtered).toContainEqual(ing);
            } else {
              expect(filtered).not.toContainEqual(ing);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Configuration

**Frontend (package.json):**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jest": "^30.0.0",
    "jest-environment-jsdom": "^30.0.0",
    "fast-check": "^3.0.0"
  }
}
```

**Backend (Cargo.toml):**

```toml
[dev-dependencies]
proptest = "1.0"
tokio-test = "0.4"

[[test]]
name = "integration"
path = "tests/integration_test.rs"
```

### Test Execution

```bash
# Run all tests
npm test                    # Frontend tests
cargo test                  # Backend tests

# Run with coverage
npm run test:coverage
cargo tarpaulin

# Run property tests only
cargo test --test proptests
npm test -- --testNamePattern="Property"
```

### Minimum Test Iterations

All property-based tests run with minimum 100 iterations:
- TypeScript (fast-check): `{ numRuns: 100 }`
- Rust (proptest): `#![proptest_config(ProptestConfig::with_cases(100))]`

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run frontend tests
        run: npm test
      
      - name: Run backend tests
        run: cd src-tauri && cargo test
      
      - name: Build application
        run: npm run tauri build
```

## Configuration Files

### Tauri Configuration

```json
// src-tauri/tauri.conf.json
{
  "productName": "Kube Ingress Search",
  "version": "0.1.0",
  "identifier": "com.kube-ingress.desktop",
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Kube Ingress Search",
        "width": 600,
        "height": 400,
        "resizable": true,
        "fullscreen": false,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "visible": false,
        "center": true
      }
    ],
    "security": {
      "csp": null
    },
    "macOSPrivateApi": true
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/icon.png"
    ],
    "macOS": {
      "minimumSystemVersion": "10.15"
    }
  },
  "plugins": {
    "global-shortcut": {
      "all": true
    },
    "shell": {
      "open": true
    },
    "store": {
      "all": true
    }
  }
}
```

### Cargo Dependencies

```toml
# src-tauri/Cargo.toml
[package]
name = "kube-ingress-desktop"
version = "0.1.0"
edition = "2021"

[dependencies]
tauri = { version = "2.0", features = ["macos-private-api"] }
tauri-plugin-global-shortcut = "2.0"
tauri-plugin-shell = "2.0"
tauri-plugin-store = "2.0"
window-vibrancy = "0.5"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.0", features = ["full"] }
kube = { version = "0.95", features = ["client", "rustls-tls"] }
k8s-openapi = { version = "0.23", features = ["v1_30"] }
chrono = { version = "0.4", features = ["serde"] }
thiserror = "2.0"

[dev-dependencies]
proptest = "1.0"
tokio-test = "0.4"
```

### Package.json

```json
{
  "name": "kube-ingress-desktop",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext ts,tsx"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@mantine/core": "^8.0.0",
    "@mantine/hooks": "^8.0.0",
    "@tabler/icons-react": "^3.0.0",
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-global-shortcut": "^2.0.0",
    "@tauri-apps/plugin-shell": "^2.0.0",
    "@tauri-apps/plugin-store": "^2.0.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "postcss": "^8.0.0",
    "autoprefixer": "^10.0.0",
    "jest": "^30.0.0",
    "jest-environment-jsdom": "^30.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "fast-check": "^3.0.0"
  }
}
```
