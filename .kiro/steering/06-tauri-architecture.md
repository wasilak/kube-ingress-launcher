# Tauri v2 Architecture and Patterns

## Overview

Tauri is a framework for building lightweight desktop applications using web technologies for the frontend and Rust for the backend. This guide ensures all Tauri development follows best practices and architectural patterns.

## Core Architecture

### Frontend-Backend Separation

```
┌─────────────────────────────────────┐
│         Frontend (React)            │
│  - UI Components                    │
│  - User Interactions                │
│  - State Management                 │
└──────────────┬──────────────────────┘
               │ IPC (invoke/emit)
┌──────────────▼──────────────────────┐
│         Backend (Rust)              │
│  - Tauri Commands                   │
│  - Business Logic                   │
│  - System Integration               │
│  - Background Tasks                 │
└─────────────────────────────────────┘
```

**Key Principle**: Frontend handles UI, Backend handles logic and system integration.

## Tauri Commands

### Command Definition

Commands are Rust functions exposed to the frontend via IPC:

```rust
#[tauri::command]
pub async fn get_data(state: State<'_, AppState>) -> Result<DataResponse, String> {
    let data = state.data.read().await;
    Ok(DataResponse {
        items: data.clone(),
    })
}
```

### Command Best Practices

1. **Return Result<T, String>**: Always return Result for error handling
2. **Use async when needed**: For I/O operations, use `async fn`
3. **Keep commands simple**: Delegate complex logic to separate modules
4. **Use State for shared data**: Access managed state via `State<'_, T>`

```rust
// ✅ Good
#[tauri::command]
pub async fn fetch_items(
    state: State<'_, AppState>,
    filter: String,
) -> Result<Vec<Item>, String> {
    let items = state.items.read().await;
    let filtered = items.iter()
        .filter(|item| item.name.contains(&filter))
        .cloned()
        .collect();
    Ok(filtered)
}

// ❌ Bad
#[tauri::command]
pub fn fetch_items(state: State<'_, AppState>) -> Vec<Item> {
    let items = state.items.read().unwrap(); // Blocking! No error handling!
    items.clone()
}
```

### Registering Commands

Register commands in the builder:

```rust
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_data,
            update_settings,
            perform_action,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## State Management

### Managed State

Use Tauri's state management for shared data:

```rust
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone)]
pub struct AppState {
    pub data: Arc<RwLock<Vec<DataItem>>>,
    pub settings: Arc<RwLock<Settings>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            data: Arc::new(RwLock::new(Vec::new())),
            settings: Arc::new(RwLock::new(Settings::default())),
        }
    }
}

// Register in setup
fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_state = AppState::new();
            app.manage(app_state);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### State Access Patterns

**Read-heavy workloads**: Use `RwLock`

```rust
#[tauri::command]
pub async fn get_items(state: State<'_, AppState>) -> Result<Vec<Item>, String> {
    let items = state.data.read().await; // Multiple readers allowed
    Ok(items.clone())
}
```

**Write operations**: Use `.write()`

```rust
#[tauri::command]
pub async fn add_item(
    state: State<'_, AppState>,
    item: Item,
) -> Result<(), String> {
    let mut items = state.data.write().await; // Exclusive access
    items.push(item);
    Ok(())
}
```

## IPC Communication

### Frontend to Backend (invoke)

```typescript
import { invoke } from '@tauri-apps/api/core';

// Call Rust command
const result = await invoke<DataResponse>('get_data');

// With parameters
const filtered = await invoke<Item[]>('fetch_items', {
  filter: 'search term',
});

// Error handling
try {
  await invoke('perform_action', { param: value });
} catch (error) {
  console.error('Command failed:', error);
}
```

### Backend to Frontend (events)

**Emit from Rust**:

```rust
use tauri::Manager;

pub async fn notify_update(app_handle: &AppHandle) {
    let _ = app_handle.emit("data-updated", ());
}

// With payload
#[derive(Clone, serde::Serialize)]
struct UpdatePayload {
    message: String,
}

pub async fn notify_with_data(app_handle: &AppHandle) {
    let _ = app_handle.emit("notification", UpdatePayload {
        message: "Data updated".to_string(),
    });
}
```

**Listen in TypeScript**:

```typescript
import { listen } from '@tauri-apps/api/event';

// Listen for events
const unlisten = await listen('data-updated', (event) => {
  console.log('Data updated!');
  refreshData();
});

// With payload
const unlisten = await listen<{ message: string }>('notification', (event) => {
  console.log('Notification:', event.payload.message);
});

// Cleanup
unlisten();
```

## Background Tasks

### Spawning Background Tasks

Use `tokio::spawn` for background work:

```rust
use tauri::async_runtime::spawn;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle().clone();
            
            // Spawn background task
            spawn(async move {
                background_worker(app_handle).await;
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn background_worker(app_handle: AppHandle) {
    use tokio::time::{interval, Duration};
    
    let mut interval = interval(Duration::from_secs(60));
    
    loop {
        interval.tick().await;
        
        // Perform background work
        if let Err(e) = do_work(&app_handle).await {
            eprintln!("Background task error: {}", e);
        }
    }
}
```

### Background Task Best Practices

1. **Non-blocking**: Use async operations, never block
2. **Error handling**: Catch and log errors, don't crash
3. **Cancellation**: Provide way to stop tasks if needed
4. **State updates**: Update managed state, emit events to frontend

## Window Management

### Window Configuration

Configure windows in `tauri.conf.json`:

```json
{
  "app": {
    "windows": [
      {
        "title": "App Name",
        "width": 800,
        "height": 600,
        "resizable": true,
        "fullscreen": false,
        "decorations": true,
        "transparent": false,
        "alwaysOnTop": false,
        "visible": true,
        "center": true
      }
    ]
  }
}
```

### Window Control from Rust

```rust
use tauri::Manager;

fn setup_window(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(window) = app.get_webview_window("main") {
        // Show/hide
        window.show()?;
        window.hide()?;
        
        // Focus
        window.set_focus()?;
        
        // Position
        window.center()?;
        
        // Check visibility
        if window.is_visible()? {
            println!("Window is visible");
        }
    }
    
    Ok(())
}
```

### Window Control from Frontend

```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';

const window = getCurrentWindow();

// Show/hide
await window.show();
await window.hide();

// Focus
await window.setFocus();

// Position
await window.center();

// Check visibility
const visible = await window.isVisible();
```

## Plugins

### Using Tauri Plugins

Common plugins for desktop applications:

```toml
# Cargo.toml
[dependencies]
tauri-plugin-shell = "2.0"           # Open URLs, run commands
tauri-plugin-store = "2.0"           # Persistent storage
tauri-plugin-global-shortcut = "2.0" # Global keyboard shortcuts
```

### Plugin Usage Examples

**Shell Plugin** (open URLs):

```rust
// In Tauri command
#[tauri::command]
pub async fn open_url(url: String) -> Result<(), String> {
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

**Store Plugin** (settings persistence):

```rust
use tauri_plugin_store::StoreExt;

pub async fn save_settings(
    app: &AppHandle,
    settings: &Settings,
) -> Result<(), String> {
    let store = app.store("settings.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;
    
    store.set("settings", serde_json::to_value(settings).unwrap());
    store.save().await
        .map_err(|e| format!("Failed to save settings: {}", e))?;
    
    Ok(())
}
```

**Global Shortcut Plugin**:

```rust
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

fn setup_shortcut(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
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

## Error Handling

### Custom Error Types

Use `thiserror` for custom errors:

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Serialization error: {0}")]
    Serde(#[from] serde_json::Error),
    
    #[error("Custom error: {0}")]
    Custom(String),
}

// Convert to String for Tauri commands
impl From<AppError> for String {
    fn from(error: AppError) -> Self {
        error.to_string()
    }
}
```

### Error Handling in Commands

```rust
#[tauri::command]
pub async fn risky_operation() -> Result<Data, String> {
    let result = perform_operation()
        .await
        .map_err(|e| format!("Operation failed: {}", e))?;
    
    Ok(result)
}
```

## macOS-Specific Features

### Vibrancy (Blur Effects)

```rust
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

fn setup_vibrancy(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(window) = app.get_webview_window("main") {
        #[cfg(target_os = "macos")]
        {
            apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)?;
        }
    }
    Ok(())
}
```

### Menu Bar (System Tray)

```rust
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;

fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let show_item = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    
    let menu = Menu::with_items(app, &[&show_item, &quit_item])?;
    
    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                    }
                }
                "quit" => app.exit(0),
                _ => {}
            }
        })
        .build(app)?;
    
    Ok(())
}
```

## Best Practices Summary

1. **Separation of Concerns**: Frontend for UI, Backend for logic
2. **Async Operations**: Use async/await for I/O, never block
3. **State Management**: Use Arc<RwLock<T>> for shared state
4. **Error Handling**: Always return Result, provide context
5. **IPC Communication**: Use invoke for commands, events for notifications
6. **Background Tasks**: Spawn with tokio, handle errors gracefully
7. **Type Safety**: Leverage Rust and TypeScript type systems
8. **Testing**: Test commands, state management, and integration

## Resources

- [Tauri Documentation](https://v2.tauri.app/)
- [Tauri Plugins](https://v2.tauri.app/plugin/)
- [Tauri Examples](https://github.com/tauri-apps/tauri/tree/dev/examples)
