/// Tauri commands for permissions management
///
/// Provides commands for checking and requesting macOS permissions.
///
/// Requirements: 10.1-10.5
use tauri::AppHandle;
use crate::permissions::{
    check_accessibility_permission,
    request_accessibility_permission,
    enable_autostart,
    disable_autostart,
    is_autostart_enabled,
};

/// Check if accessibility permission is granted
///
/// # Returns
/// - `Ok(true)` if permission is granted
/// - `Ok(false)` if permission is not granted
/// - `Err` with error message if check fails
///
/// # Requirements
/// - 10.1: Check for accessibility permission on shortcut registration
#[tauri::command]
pub async fn check_accessibility() -> Result<bool, String> {
    check_accessibility_permission()
        .map_err(|e| e.to_string())
}

/// Request accessibility permission from the user
///
/// Opens System Settings to the Accessibility pane.
///
/// # Requirements
/// - 10.2: Display dialog with explanation and "Open System Settings" button
/// - 10.3: Open System Settings to Accessibility pane
#[tauri::command]
pub async fn request_accessibility() -> Result<(), String> {
    request_accessibility_permission()
        .map_err(|e| e.to_string())
}

/// Enable autostart for the application
///
/// # Requirements
/// - 10.4: Use tauri-plugin-autostart for login item registration
/// - 10.5: Handle registration failures gracefully
#[tauri::command]
pub async fn enable_app_autostart(app: AppHandle) -> Result<(), String> {
    enable_autostart(&app)
        .map_err(|e| e.to_string())
}

/// Disable autostart for the application
///
/// # Requirements
/// - 10.4: Use tauri-plugin-autostart for login item registration
/// - 10.5: Handle registration failures gracefully
#[tauri::command]
pub async fn disable_app_autostart(app: AppHandle) -> Result<(), String> {
    disable_autostart(&app)
        .map_err(|e| e.to_string())
}

/// Check if autostart is enabled
///
/// # Returns
/// - `Ok(true)` if autostart is enabled
/// - `Ok(false)` if autostart is disabled
/// - `Err` with error message if check fails
#[tauri::command]
pub async fn check_autostart(app: AppHandle) -> Result<bool, String> {
    is_autostart_enabled(&app)
        .map_err(|e| e.to_string())
}
