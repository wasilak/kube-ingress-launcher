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

/// Hide the main window
///
/// This command hides the main window and updates the tray menu.
/// It's called from the frontend when the window should be hidden
/// (e.g., on Escape key or focus loss).
///
/// # Requirements
/// - 2.5: Hide window on Escape key
/// - 2.6: Hide window on focus loss
#[tauri::command]
pub async fn hide_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| {
            format!("Failed to hide window: {}", e)
        })?;
        
        // Update tray menu to show "Show"
        update_tray_menu_state(false, app).await?;
        
        Ok(())
    } else {
        Err("Could not get window".to_string())
    }
}
