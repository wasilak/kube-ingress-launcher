/// Autostart Permission Handling for macOS
///
/// Handles enabling/disabling autostart (login item registration) for the application.
///
/// Requirements: 10.4-10.5

use crate::error::AppError;
use tauri_plugin_autostart::ManagerExt;

/// Enable autostart for the application
///
/// Registers the application as a macOS login item so it starts automatically
/// when the user logs in.
///
/// # Arguments
/// * `app` - The Tauri application handle
///
/// # Returns
/// - `Ok(())` if autostart was enabled successfully
/// - `Err` if registration failed
///
/// # Requirements
/// - 10.4: Use tauri-plugin-autostart for login item registration
/// - 10.5: Handle registration failures gracefully
pub fn enable_autostart(app: &tauri::AppHandle) -> Result<(), AppError> {
    let autostart_manager = app.autolaunch();
    
    autostart_manager
        .enable()
        .map_err(|e| AppError::PermissionError(format!("Failed to enable autostart: {}", e)))?;

    Ok(())
}

/// Disable autostart for the application
///
/// Removes the application from macOS login items.
///
/// # Arguments
/// * `app` - The Tauri application handle
///
/// # Returns
/// - `Ok(())` if autostart was disabled successfully
/// - `Err` if removal failed
///
/// # Requirements
/// - 10.4: Use tauri-plugin-autostart for login item registration
/// - 10.5: Handle registration failures gracefully
pub fn disable_autostart(app: &tauri::AppHandle) -> Result<(), AppError> {
    let autostart_manager = app.autolaunch();
    
    autostart_manager
        .disable()
        .map_err(|e| AppError::PermissionError(format!("Failed to disable autostart: {}", e)))?;

    Ok(())
}

/// Check if autostart is currently enabled
///
/// # Arguments
/// * `app` - The Tauri application handle
///
/// # Returns
/// - `Ok(true)` if autostart is enabled
/// - `Ok(false)` if autostart is disabled
/// - `Err` if the check fails
pub fn is_autostart_enabled(app: &tauri::AppHandle) -> Result<bool, AppError> {
    let autostart_manager = app.autolaunch();
    
    autostart_manager
        .is_enabled()
        .map_err(|e| AppError::PermissionError(format!("Failed to check autostart status: {}", e)))
}

/// Get a user-friendly error message for autostart failures
///
/// Returns a message explaining what went wrong and how to fix it.
pub fn get_autostart_error_message() -> String {
    "Could not enable autostart. Please check System Settings > General > Login Items.".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_autostart_error_message() {
        let message = get_autostart_error_message();
        assert!(message.contains("autostart"));
        assert!(message.contains("System Settings"));
        assert!(message.contains("Login Items"));
    }
}
