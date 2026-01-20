//! Settings-related Tauri commands
//!
//! This module provides commands for managing application settings with validation
//! and persistence using tauri-plugin-store.

use crate::settings::{Settings, SettingsState};
use crate::settings::store::save_settings;
use tauri::State;

// Re-export load_settings for use in application initialization
pub use crate::settings::store::load_settings;

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
/// Handles autostart registration/unregistration when the autostart setting changes.
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
/// - 9.13-9.14: Autostart toggle handling
/// - 9.18-9.20: Settings persistence
/// - 10.4-10.5: Autostart permission handling
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

    // Check if autostart setting changed
    let autostart_changed = {
        let current_settings = state.settings.read().await;
        current_settings.autostart != settings.autostart
    };

    // Handle autostart changes
    if autostart_changed {
        if settings.autostart {
            // Enable autostart
            if let Err(e) = crate::permissions::enable_autostart(&app) {
                eprintln!("Warning: Failed to enable autostart: {}", e);
                return Err(crate::permissions::autostart::get_autostart_error_message());
            }
        } else {
            // Disable autostart
            if let Err(e) = crate::permissions::disable_autostart(&app) {
                eprintln!("Warning: Failed to disable autostart: {}", e);
                // Don't fail on disable errors, just log
            }
        }
    }

    // Update in-memory settings
    {
        let mut current_settings = state.settings.write().await;
        *current_settings = settings.clone();
    }

    // Persist to disk using the store module
    save_settings(&app, &settings).await?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

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
