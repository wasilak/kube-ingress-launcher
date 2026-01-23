//! Window-related Tauri commands
//!
//! This module provides commands for window management and tray menu updates.

use tauri::Manager;

/// Update the tray menu based on window visibility
///
/// This command should be called when the window visibility changes
/// to ensure the tray menu reflects the current state.
///
/// # Arguments
/// * `is_visible` - Whether the window is currently visible
///
/// # Requirements
/// - 20.4.1: Dynamic menu item text
/// - 20.4.2: Window state tracking
#[tauri::command]
pub async fn update_tray_menu_state(
    is_visible: bool,
    app: tauri::AppHandle,
) -> Result<(), String> {
    use tauri::menu::{Menu, MenuItemBuilder};

    // Determine menu text based on visibility
    let show_text = if is_visible {
        "Hide (⌘⇧K)"
    } else {
        "Show (⌘⇧K)"
    };

    // Rebuild menu with updated text
    let show_item = MenuItemBuilder::with_id("show", show_text)
        .build(&app)
        .map_err(|e| format!("Failed to build menu item: {}", e))?;
    
    let options_item = MenuItemBuilder::with_id("options", "Options...")
        .build(&app)
        .map_err(|e| format!("Failed to build menu item: {}", e))?;
    
    let quit_item = MenuItemBuilder::with_id("quit", "Quit")
        .build(&app)
        .map_err(|e| format!("Failed to build menu item: {}", e))?;

    let menu = Menu::with_items(&app, &[&show_item, &options_item, &quit_item])
        .map_err(|e| format!("Failed to create menu: {}", e))?;

    // Update tray menu
    if let Some(tray) = app.tray_by_id("main") {
        tray.set_menu(Some(menu))
            .map_err(|e| format!("Failed to set menu: {}", e))?;
    }

    Ok(())
}

/// Test command to manually hide the window
///
/// This is a debug command to test if window hiding works at all.
#[tauri::command]
pub async fn test_hide_window(app: tauri::AppHandle) -> Result<(), String> {
    eprintln!("[test_hide_window] Command called");
    
    if let Some(window) = app.get_webview_window("main") {
        eprintln!("[test_hide_window] Got window, attempting to hide");
        window.hide().map_err(|e| {
            eprintln!("[test_hide_window] Failed to hide: {}", e);
            format!("Failed to hide window: {}", e)
        })?;
        eprintln!("[test_hide_window] Window hidden successfully");
        
        // Update tray menu
        update_tray_menu_state(false, app).await?;
        
        Ok(())
    } else {
        eprintln!("[test_hide_window] Could not get window");
        Err("Could not get window".to_string())
    }
}
