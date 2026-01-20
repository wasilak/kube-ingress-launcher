// Application modules
pub mod state;
pub mod k8s;
pub mod error;
pub mod refresh;
pub mod commands;
pub mod settings;
pub mod permissions;

use tauri::{Manager, Emitter};
use state::AppState;
use settings::SettingsState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--flag1", "--flag2"])))
        .setup(|app| {
            // Initialize application state
            let app_state = AppState::new();
            app.manage(app_state.clone());

            // Initialize settings state
            let settings_state = SettingsState::new();
            app.manage(settings_state);

            // Setup window vibrancy (macOS only)
            if let Some(window) = app.get_webview_window("main") {
                #[cfg(target_os = "macos")]
                {
                    use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                    if let Err(e) = apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None) {
                        eprintln!("Failed to apply vibrancy: {}", e);
                    }
                }
            }

            // Setup menu bar tray
            if let Err(e) = setup_tray(app) {
                eprintln!("Failed to setup tray: {}", e);
            }

            // Register global shortcut
            if let Err(e) = setup_global_shortcut(app) {
                eprintln!("Failed to setup global shortcut: {}", e);
            }

            // Start background refresh task
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                refresh::task::start_refresh_task(app_handle).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::ingresses::get_ingresses,
            commands::ingresses::open_url,
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::kubernetes::get_contexts,
            commands::kubernetes::switch_context,
            commands::permissions::check_accessibility,
            commands::permissions::request_accessibility,
            commands::permissions::enable_app_autostart,
            commands::permissions::disable_app_autostart,
            commands::permissions::check_autostart,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Setup the system tray menu
///
/// Creates a menu bar tray with Show, Options, and Quit items.
/// The Show item displays the current global shortcut.
///
/// # Requirements
/// - 3.1-3.11: Menu bar application behavior
fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::menu::{Menu, MenuItemBuilder};
    use tauri::tray::{TrayIconBuilder, MouseButton, MouseButtonState};

    let show_item = MenuItemBuilder::with_id("show", "Show (⌘⇧K)").build(app)?;
    let options_item = MenuItemBuilder::with_id("options", "Options...").build(app)?;
    let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let menu = Menu::with_items(app, &[&show_item, &options_item, &quit_item])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                        let _ = window.center();
                    }
                }
                "options" => {
                    // Emit event to open settings dialog
                    let _ = app.emit("open-settings", ());
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let tauri::tray::TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.center();
                }
            }
        })
        .build(app)?;

    Ok(())
}

/// Setup the global keyboard shortcut
///
/// Registers Cmd+Shift+K (or Ctrl+Shift+K on non-Mac) to show/hide the window.
/// Checks for accessibility permission first and handles gracefully if not granted.
///
/// # Requirements
/// - 2.1-2.7: Global keyboard shortcut
/// - 10.1: Check for accessibility permission on shortcut registration
/// - 10.6: Gracefully handle missing accessibility permission
/// - 13.10: Global shortcut plugin usage
fn setup_global_shortcut(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

    // Check accessibility permission on macOS
    #[cfg(target_os = "macos")]
    {
        match permissions::check_accessibility_permission() {
            Ok(true) => {
                // Permission granted, proceed with shortcut registration
            }
            Ok(false) => {
                eprintln!("Warning: Accessibility permission not granted. Global shortcut will not work.");
                eprintln!("Please grant permission in System Settings > Privacy & Security > Accessibility.");
                // Store permission warning in state for display in menu tooltip
                return Ok(()); // Don't fail, just skip shortcut registration
            }
            Err(e) => {
                eprintln!("Warning: Failed to check accessibility permission: {}", e);
                // Continue anyway, shortcut registration might still work
            }
        }
    }

    let shortcut = "CmdOrCtrl+Shift+K".parse::<Shortcut>()?;

    match app.global_shortcut().on_shortcut(shortcut, |app, _shortcut, _event| {
        if let Some(window) = app.get_webview_window("main") {
            match window.is_visible() {
                Ok(true) => {
                    let _ = window.hide();
                }
                Ok(false) => {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.center();
                }
                Err(e) => {
                    eprintln!("Failed to check window visibility: {}", e);
                }
            }
        }
    }) {
        Ok(_) => Ok(()),
        Err(e) => {
            eprintln!("Warning: Failed to register global shortcut: {}", e);
            eprintln!("You can still open the window from the menu bar.");
            Ok(()) // Don't fail the app, just log the error
        }
    }
}
