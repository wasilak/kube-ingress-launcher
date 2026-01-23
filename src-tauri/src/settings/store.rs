//! Settings persistence using tauri-plugin-store
//!
//! This module provides functions for loading and saving application settings
//! to disk using tauri-plugin-store.
//!
//! # Requirements
//! - 9.18-9.20: Settings persistence
//! - 13.12: tauri-plugin-store usage

use super::Settings;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

/// Load settings from disk
///
/// Loads persisted settings from the store. If no settings are found or
/// an error occurs, returns default settings.
///
/// # Arguments
/// * `app` - Tauri application handle
///
/// # Returns
/// * `Ok(Settings)` - Loaded settings or default settings if not found
/// * `Err(String)` - Error message if store access fails
///
/// # Requirements
/// - 9.18-9.20: Settings persistence
/// - 13.12: tauri-plugin-store usage
pub async fn load_settings(app: &AppHandle) -> Result<Settings, String> {
    let store = app
        .store("settings.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;

    match store.get("settings") {
        Some(value) => {
            serde_json::from_value(value.clone())
                .map_err(|e| format!("Failed to deserialize settings: {}", e))
        }
        None => {
            // No settings found, return default
            Ok(Settings::default())
        }
    }
}

/// Save settings to disk
///
/// Persists the provided settings to disk using tauri-plugin-store.
/// Settings are saved to a JSON file in the application data directory.
///
/// # Arguments
/// * `app` - Tauri application handle
/// * `settings` - Settings to persist
///
/// # Returns
/// * `Ok(())` - Settings saved successfully
/// * `Err(String)` - Error message if save fails
///
/// # Requirements
/// - 9.18-9.20: Settings persistence
/// - 13.12: tauri-plugin-store usage
pub async fn save_settings(app: &AppHandle, settings: &Settings) -> Result<(), String> {
    let store = app
        .store("settings.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;

    store.set("settings", serde_json::to_value(settings).unwrap());
    store
        .save()
        .map_err(|e| format!("Failed to save settings: {}", e))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_settings_default() {
        let settings = Settings::default();
        assert_eq!(settings.global_shortcut, "CmdOrCtrl+Shift+K");
        assert_eq!(settings.refresh_interval_secs, 60);
        assert!(!settings.autostart);
        assert_eq!(settings.kube_context, "");
        assert_eq!(settings.theme, "system");
    }

    #[test]
    fn test_settings_serialization() {
        let settings = Settings {
            global_shortcut: "Cmd+K".to_string(),
            refresh_interval_secs: 120,
            autostart: true,
            kube_context: "minikube".to_string(),
            theme: "dark".to_string(),
        };

        let json = serde_json::to_string(&settings).unwrap();
        assert!(json.contains("Cmd+K"));
        assert!(json.contains("120"));
        assert!(json.contains("minikube"));
        assert!(json.contains("dark"));

        let deserialized: Settings = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.global_shortcut, "Cmd+K");
        assert_eq!(deserialized.refresh_interval_secs, 120);
        assert!(deserialized.autostart);
        assert_eq!(deserialized.kube_context, "minikube");
        assert_eq!(deserialized.theme, "dark");
    }

    #[test]
    fn test_settings_default_values() {
        let settings = Settings::default();
        
        // Verify default shortcut
        assert_eq!(settings.global_shortcut, "CmdOrCtrl+Shift+K");
        
        // Verify default refresh interval (60 seconds)
        assert_eq!(settings.refresh_interval_secs, 60);
        
        // Verify autostart is disabled by default
        assert!(!settings.autostart);
        
        // Verify kube context is empty by default
        assert!(settings.kube_context.is_empty());
        
        // Verify theme is system by default
        assert_eq!(settings.theme, "system");
    }
}
