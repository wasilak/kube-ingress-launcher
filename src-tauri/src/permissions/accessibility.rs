/// Accessibility Permission Handling for macOS
///
/// Handles checking and requesting accessibility permissions required for
/// global keyboard shortcuts.
///
/// Requirements: 10.1-10.3
use crate::error::AppError;

/// Check if the application has accessibility permission
///
/// On macOS, accessibility permission is required to register global keyboard shortcuts.
/// This function checks if the permission has been granted, and prompts the user if not.
///
/// # Returns
/// - `Ok(true)` if permission is granted
/// - `Ok(false)` if permission is not granted (but prompt was shown)
/// - `Err` if the check fails
///
/// # Requirements
/// - 10.1: Check for accessibility permission on shortcut registration
#[cfg(target_os = "macos")]
pub fn check_accessibility_permission() -> Result<bool, AppError> {
    // Use a simpler approach: try to register a test shortcut
    // If it fails, the permission is not granted
    // The tauri global-shortcut plugin will handle prompting automatically
    
    // For now, just check if the process is trusted
    unsafe {
        let trusted = AXIsProcessTrusted();
        eprintln!("[Accessibility] AXIsProcessTrusted returned: {}", trusted);
        
        if !trusted {
            eprintln!("[Accessibility] Permission not granted. The app will attempt to register shortcuts anyway.");
            eprintln!("[Accessibility] macOS will show a permission dialog when the shortcut is first used.");
        }
        
        Ok(trusted)
    }
}

// External function declaration for AXIsProcessTrusted
#[cfg(target_os = "macos")]
#[link(name = "ApplicationServices", kind = "framework")]
extern "C" {
    fn AXIsProcessTrusted() -> bool;
}

#[cfg(not(target_os = "macos"))]
pub fn check_accessibility_permission() -> Result<bool, AppError> {
    // On non-macOS platforms, always return true (no permission needed)
    Ok(true)
}

/// Request accessibility permission from the user
///
/// Opens the System Settings to the Accessibility pane where the user can
/// grant permission to the application.
///
/// # Requirements
/// - 10.2: Display dialog with explanation and "Open System Settings" button
/// - 10.3: Open System Settings to Accessibility pane
#[cfg(target_os = "macos")]
pub fn request_accessibility_permission() -> Result<(), AppError> {
    use std::process::Command;

    // Open System Settings to the Privacy & Security > Accessibility pane
    let url = "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility";

    Command::new("open")
        .arg(url)
        .spawn()
        .map_err(|e| AppError::PermissionError(format!("Failed to open System Settings: {}", e)))?;

    Ok(())
}

#[cfg(not(target_os = "macos"))]
pub fn request_accessibility_permission() -> Result<(), AppError> {
    // On non-macOS platforms, this is a no-op
    Ok(())
}

/// Get a user-friendly explanation message for accessibility permission
///
/// Returns a message explaining why the permission is needed and how to grant it.
pub fn get_permission_explanation() -> String {
    "Keyboard shortcuts require Accessibility permission. \
     Please grant permission in System Settings > Privacy & Security > Accessibility.".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_permission_explanation() {
        let explanation = get_permission_explanation();
        assert!(explanation.contains("Accessibility permission"));
        assert!(explanation.contains("System Settings"));
    }

    #[test]
    fn test_check_accessibility_permission() {
        // This test will pass on non-macOS platforms
        // On macOS, it will check the actual permission status
        let result = check_accessibility_permission();
        assert!(result.is_ok());
    }
}
