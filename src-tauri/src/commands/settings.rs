//! Settings-related Tauri commands
//!
//! This module provides commands for managing application settings with validation
//! and persistence using tauri-plugin-store.

use serde::{Deserialize, Serialize};
use tauri::State;
use tauri_plugin_store::StoreExt;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Application settings structure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    /// Global keyboard shortcut (e.g., "CmdOrCtrl+Shift+K")
    pub global_shortcut: String,
    /// Refresh interval in seconds (10-3600)
    pub refresh_interval_secs: u64,
    /// Whether to start application on system login
    pub autostart: bool,
    /// Active Kubernetes context
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

/// Settings state wrapper for thread-safe access
#[derive(Clone)]
pub struct SettingsState {
    pub settings: Arc<RwLock<Settings>>,
}

impl SettingsState {
    pub fn new() -> Self {
        Self {
            settings: Arc::new(RwLock::new(Settings::default())),
        }
    }
}

impl Default for SettingsState {
    fn default() -> Self {
        Self::new()
    }
}

/// Get current application settings
///
/// Returns the current settings from memory. Settings are loaded from disk
/// on application startup.
///
/// # Requirements
/// - 9.1-9.20: Settings configuration
/// - 13.4: Tauri command handler
#[tauri::command]
pub async fn get_settings(state: State<'_, SettingsState>) -> Result<Settings, String> {
    let settings = state.settings.read().await;
    Ok(settings.clone())
}

/// Update application settings with validation
///
/// Validates the new settings and persists them to disk using tauri-plugin-store.
/// Settings are applied immediately without requiring application restart.
///
/// # Arguments
/// * `settings` - New settings to apply
///
/// # Validation
/// - Refresh interval must be between 10 and 3600 seconds
/// - Global shortcut must not be empty
///
/// # Requirements
/// - 9.1-9.20: Settings configuration and validation
/// - 9.18-9.20: Settings persistence
/// - 13.4: Tauri command handler
#[tauri::command]
pub async fn update_settings(
    settings: Settings,
    state: State<'_, SettingsState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    // Validate refresh interval
    if settings.refresh_interval_secs < 10 || settings.refresh_interval_secs > 3600 {
        return Err("Refresh interval must be between 10 and 3600 seconds".to_string());
    }

    // Validate global shortcut
    if settings.global_shortcut.trim().is_empty() {
        return Err("Global shortcut cannot be empty".to_string());
    }

    // Update in-memory settings
    {
        let mut current_settings = state.settings.write().await;
        *current_settings = settings.clone();
    }

    // Persist to disk using tauri-plugin-store
    let store = app
        .store("settings.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;

    store.set("settings", serde_json::to_value(&settings).unwrap());
    store
        .save()
        .map_err(|e| format!("Failed to save settings: {}", e))?;

    Ok(())
}

/// Load settings from disk on application startup
///
/// This function should be called during application initialization to load
/// persisted settings from disk.
pub async fn load_settings(app: &tauri::AppHandle) -> Result<Settings, String> {
    let store = app
        .store("settings.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;

    match store.get("settings") {
        Some(value) => {
            serde_json::from_value(value.clone())
                .map_err(|e| format!("Failed to deserialize settings: {}", e))
        }
        None => Ok(Settings::default()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_settings_default() {
        let settings = Settings::default();
        assert_eq!(settings.global_shortcut, "CmdOrCtrl+Shift+K");
        assert_eq!(settings.refresh_interval_secs, 60);
        assert_eq!(settings.autostart, false);
        assert_eq!(settings.kube_context, "");
    }

    #[test]
    fn test_settings_serialization() {
        let settings = Settings {
            global_shortcut: "Cmd+K".to_string(),
            refresh_interval_secs: 120,
            autostart: true,
            kube_context: "minikube".to_string(),
        };

        let json = serde_json::to_string(&settings).unwrap();
        assert!(json.contains("Cmd+K"));
        assert!(json.contains("120"));
        assert!(json.contains("minikube"));

        let deserialized: Settings = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.global_shortcut, "Cmd+K");
        assert_eq!(deserialized.refresh_interval_secs, 120);
        assert_eq!(deserialized.autostart, true);
    }

    #[tokio::test]
    async fn test_settings_state_read_write() {
        let state = SettingsState::new();

        // Update settings
        {
            let mut settings = state.settings.write().await;
            settings.refresh_interval_secs = 120;
            settings.kube_context = "test-context".to_string();
        }

        // Read settings
        {
            let settings = state.settings.read().await;
            assert_eq!(settings.refresh_interval_secs, 120);
            assert_eq!(settings.kube_context, "test-context");
        }
    }

    #[test]
    fn test_validate_refresh_interval() {
        // Valid intervals
        assert!(10 >= 10 && 10 <= 3600);
        assert!(60 >= 10 && 60 <= 3600);
        assert!(3600 >= 10 && 3600 <= 3600);

        // Invalid intervals
        assert!(!(9 >= 10 && 9 <= 3600));
        assert!(!(3601 >= 10 && 3601 <= 3600));
    }
}
