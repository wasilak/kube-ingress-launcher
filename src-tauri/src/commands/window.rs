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
    
    let statistics_item = MenuItemBuilder::with_id("statistics", "Statistics")
        .build(&app)
        .map_err(|e| format!("Failed to build menu item: {}", e))?;
    
    let options_item = MenuItemBuilder::with_id("options", "Options")
        .build(&app)
        .map_err(|e| format!("Failed to build menu item: {}", e))?;
    
    let quit_item = MenuItemBuilder::with_id("quit", "Quit")
        .build(&app)
        .map_err(|e| format!("Failed to build menu item: {}", e))?;

    let menu = Menu::with_items(&app, &[&show_item, &statistics_item, &options_item, &quit_item])
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

/// Open the statistics window
///
/// This command opens the statistics window, creating it if it doesn't exist.
/// The window is shown, focused, and centered on first open.
/// Window size and position are persisted and restored on subsequent opens.
///
/// # Requirements
/// - 4.2: Open statistics window from menu
/// - 12.1: Statistics window management
/// - 12.4: Window state persistence
#[tauri::command]
pub async fn open_statistics_window(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::{WebviewUrl, WebviewWindowBuilder};
    use tauri_plugin_store::StoreExt;
    
    // Try to get existing statistics window
    if let Some(window) = app.get_webview_window("statistics") {
        // Window exists, just show and focus it
        window.show().map_err(|e| {
            format!("Failed to show statistics window: {}", e)
        })?;
        
        window.set_focus().map_err(|e| {
            format!("Failed to focus statistics window: {}", e)
        })?;
        
        Ok(())
    } else {
        // Window doesn't exist, create it
        
        // Try to load saved window state
        let store = app.store("window_state.json")
            .map_err(|e| format!("Failed to access store: {}", e))?;
        
        let saved_width = store.get("statistics_width")
            .and_then(|v| v.as_f64())
            .unwrap_or(800.0);
        
        let saved_height = store.get("statistics_height")
            .and_then(|v| v.as_f64())
            .unwrap_or(600.0);
        
        let saved_x = store.get("statistics_x")
            .and_then(|v| v.as_i64())
            .map(|v| v as i32);
        
        let saved_y = store.get("statistics_y")
            .and_then(|v| v.as_i64())
            .map(|v| v as i32);
        
        // Build the window
        let mut builder = WebviewWindowBuilder::new(
            &app,
            "statistics",
            WebviewUrl::App("index.html".into())
        )
        .title("Usage Statistics")
        .inner_size(saved_width, saved_height)
        .min_inner_size(600.0, 400.0)
        .resizable(true)
        .visible(false); // Start hidden, show after build
        
        // Set position if saved
        if let (Some(x), Some(y)) = (saved_x, saved_y) {
            builder = builder.position(x as f64, y as f64);
        } else {
            builder = builder.center();
        }
        
        let window = builder.build()
            .map_err(|e| format!("Failed to create statistics window: {}", e))?;
        
        // Setup window close event to save state
        let app_handle = app.clone();
        window.on_window_event(move |event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // Save window state before closing
                if let Some(win) = app_handle.get_webview_window("statistics") {
                    let _ = save_statistics_window_state(&app_handle, &win);
                }
            }
        });
        
        // Show and focus the window
        window.show().map_err(|e| {
            format!("Failed to show statistics window: {}", e)
        })?;
        
        window.set_focus().map_err(|e| {
            format!("Failed to focus statistics window: {}", e)
        })?;
        
        Ok(())
    }
}

/// Save the statistics window state (size and position)
fn save_statistics_window_state(
    app: &tauri::AppHandle,
    window: &tauri::WebviewWindow,
) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;
    
    let store = app.store("window_state.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;
    
    // Get window size
    if let Ok(size) = window.inner_size() {
        store.set("statistics_width", serde_json::json!(size.width as f64));
        store.set("statistics_height", serde_json::json!(size.height as f64));
    }
    
    // Get window position
    if let Ok(position) = window.outer_position() {
        store.set("statistics_x", serde_json::json!(position.x));
        store.set("statistics_y", serde_json::json!(position.y));
    }
    
    // Save to disk
    store.save()
        .map_err(|e| format!("Failed to save window state: {}", e))
}
