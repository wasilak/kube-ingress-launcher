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
            // Set activation policy to accessory to hide from dock (macOS only)
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            // Initialize application state
            let app_state = AppState::new();
            app.manage(app_state.clone());

            // Initialize settings state
            let settings_state = SettingsState::new();
            app.manage(settings_state);

            // Setup window vibrancy and corner radius (macOS only)
            if let Some(window) = app.get_webview_window("main") {
                #[cfg(target_os = "macos")]
                {
                    use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                    use cocoa::appkit::{NSWindow, NSWindowStyleMask, NSColor};
                    use cocoa::base::{id, nil, NO, YES};
                    use objc::{msg_send, sel, sel_impl};
                    
                    // Apply vibrancy effect
                    if let Err(e) = apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None) {
                        eprintln!("Failed to apply vibrancy: {}", e);
                    }
                    
                    // Get the native NSWindow
                    let ns_window = window.ns_window().unwrap() as id;
                    
                    unsafe {
                        // Make window fully transparent
                        let _: () = msg_send![ns_window, setOpaque: NO];
                        let clear_color: id = NSColor::clearColor(nil);
                        let _: () = msg_send![ns_window, setBackgroundColor: clear_color];
                        
                        // Enable rounded corners by setting the appropriate style mask
                        let mut style_mask: NSWindowStyleMask = ns_window.styleMask();
                        style_mask |= NSWindowStyleMask::NSFullSizeContentViewWindowMask;
                        // Add titled window mask to enable rounded corners
                        style_mask |= NSWindowStyleMask::NSTitledWindowMask;
                        ns_window.setStyleMask_(style_mask);
                        
                        // Hide the title bar but keep rounded corners
                        let _: () = msg_send![ns_window, setTitlebarAppearsTransparent: YES];
                        let _: () = msg_send![ns_window, setTitleVisibility: 1]; // NSWindowTitleHidden = 1
                        
                        // Ensure the window has a shadow for depth
                        let _: () = msg_send![ns_window, setHasShadow: YES];
                        
                        // Apply corner radius to content view layer for extra clipping
                        let content_view: id = ns_window.contentView();
                        let _: () = msg_send![content_view, setWantsLayer: YES];
                        let layer: id = msg_send![content_view, layer];
                        let _: () = msg_send![layer, setCornerRadius: 16.0f64];
                        let _: () = msg_send![layer, setMasksToBounds: YES];
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
            
            // Handle window close event to hide instead of quit
            // This must be done AFTER window is created
            if let Some(window) = app.get_webview_window("main") {
                let app_handle = app.handle().clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        eprintln!("Close requested - preventing and hiding window");
                        api.prevent_close();
                        
                        // Hide the window
                        if let Some(win) = app_handle.get_webview_window("main") {
                            if let Err(e) = win.hide() {
                                eprintln!("Failed to hide window: {}", e);
                            } else {
                                eprintln!("Window hidden successfully");
                            }
                            
                            // Update tray menu
                            if let Err(e) = update_tray_menu(&app_handle, false) {
                                eprintln!("Failed to update tray menu: {}", e);
                            }
                        }
                    }
                });
            }

            // Validate kubeconfig on startup
            let app_handle_validation = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match k8s::client::Client::validate_kubeconfig().await {
                    Ok(_) => {
                        eprintln!("Kubeconfig validation successful");
                    }
                    Err(e) => {
                        eprintln!("Kubeconfig validation failed: {}", e);
                        eprintln!("The application will continue running, but Kubernetes connectivity may not work.");
                        eprintln!("Please check your kubeconfig file and cluster connectivity.");
                        
                        // Store the validation error in state so it can be displayed to the user
                        if let Some(state) = app_handle_validation.try_state::<AppState>() {
                            let error_info = state::ErrorInfo {
                                message: format!("Kubeconfig validation failed: {}", e),
                                details: Some("Please check your kubeconfig file and ensure it has a valid current-context set.".to_string()),
                                timestamp: chrono::Utc::now().to_rfc3339(),
                            };
                            
                            let mut last_error = state.last_error.write().await;
                            *last_error = Some(error_info);
                        }
                    }
                }
            });

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
            commands::window::update_tray_menu_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Setup the system tray menu
///
/// Creates a menu bar tray with Show/Hide, Options, and Quit items.
/// The Show/Hide item dynamically changes based on window visibility.
///
/// # Requirements
/// - 3.1-3.11: Menu bar application behavior
/// - 20.4.1: Dynamic Show/Hide menu item text
/// - 20.4.2: Window state tracking
fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::menu::{Menu, MenuItemBuilder};
    use tauri::tray::{TrayIconBuilder, MouseButton, MouseButtonState};

    // Create initial menu with "Show" (window starts hidden)
    let show_item = MenuItemBuilder::with_id("show", "Show (⌘⇧K)").build(app)?;
    let options_item = MenuItemBuilder::with_id("options", "Options...").build(app)?;
    let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let menu = Menu::with_items(app, &[&show_item, &options_item, &quit_item])?;

    let _tray = TrayIconBuilder::with_id("main")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .icon_as_template(true)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        // Toggle window visibility
                        match window.is_visible() {
                            Ok(true) => {
                                let _ = window.hide();
                                // Update menu to show "Show"
                                let _ = update_tray_menu(app, false);
                            }
                            Ok(false) => {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.center();
                                // Update menu to show "Hide"
                                let _ = update_tray_menu(app, true);
                            }
                            Err(e) => {
                                eprintln!("Failed to check window visibility: {}", e);
                            }
                        }
                    }
                }
                "options" => {
                    // Show the main window first if it's hidden
                    if let Some(window) = app.get_webview_window("main") {
                        if let Ok(false) = window.is_visible() {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.center();
                            // Update menu to show "Hide"
                            let _ = update_tray_menu(app, true);
                        }
                    }
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
                    // Toggle window visibility on tray click
                    match window.is_visible() {
                        Ok(true) => {
                            let _ = window.hide();
                            // Update menu to show "Show"
                            let _ = update_tray_menu(app, false);
                        }
                        Ok(false) => {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.center();
                            // Update menu to show "Hide"
                            let _ = update_tray_menu(app, true);
                        }
                        Err(e) => {
                            eprintln!("Failed to check window visibility: {}", e);
                        }
                    }
                }
            }
        })
        .build(app)?;

    // Setup window event listeners to update menu text
    if let Some(window) = app.get_webview_window("main") {
        let app_handle = app.handle().clone();
        
        // Listen for window show events
        window.on_window_event(move |event| {
            match event {
                tauri::WindowEvent::Focused(focused) => {
                    // Update menu when window gains or loses focus
                    if let Err(e) = update_tray_menu(&app_handle, *focused) {
                        eprintln!("Failed to update tray menu: {}", e);
                    }
                }
                _ => {}
            }
        });
    }

    Ok(())
}

/// Update the tray menu item text based on window visibility
///
/// Changes "Show (⌘⇧K)" to "Hide (⌘⇧K)" when window is visible,
/// and vice versa.
///
/// # Requirements
/// - 20.4.1: Dynamic menu item text
/// - 20.4.2: Window state tracking
fn update_tray_menu(app: &tauri::AppHandle, is_visible: bool) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::menu::{Menu, MenuItemBuilder};

    // Determine menu text based on visibility
    let show_text = if is_visible {
        "Hide (⌘⇧K)"
    } else {
        "Show (⌘⇧K)"
    };

    // Rebuild menu with updated text
    let show_item = MenuItemBuilder::with_id("show", show_text).build(app)?;
    let options_item = MenuItemBuilder::with_id("options", "Options...").build(app)?;
    let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let menu = Menu::with_items(app, &[&show_item, &options_item, &quit_item])?;

    // Update tray menu
    if let Some(tray) = app.tray_by_id("main") {
        tray.set_menu(Some(menu))?;
    }

    Ok(())
}

/// Setup the global keyboard shortcut
///
/// Registers Cmd+Shift+K (or Ctrl+Shift+K on non-Mac) to show/hide the window.
/// On macOS, this will prompt for accessibility permission if not already granted.
///
/// # Requirements
/// - 2.1-2.7: Global keyboard shortcut
/// - 10.1: Check for accessibility permission on shortcut registration
/// - 10.6: Gracefully handle missing accessibility permission
/// - 13.10: Global shortcut plugin usage
fn setup_global_shortcut(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

    // Check accessibility permission on macOS (for logging purposes)
    #[cfg(target_os = "macos")]
    {
        match permissions::check_accessibility_permission() {
            Ok(true) => {
                eprintln!("Accessibility permission granted. Global shortcut will work.");
            }
            Ok(false) => {
                eprintln!("Accessibility permission not yet granted.");
                eprintln!("Attempting to register shortcut anyway - macOS may show permission dialog.");
            }
            Err(e) => {
                eprintln!("Warning: Failed to check accessibility permission: {}", e);
            }
        }
    }

    let shortcut = "CmdOrCtrl+Shift+K".parse::<Shortcut>()?;

    // Always try to register the shortcut
    // The system will handle permission prompts if needed
    match app.global_shortcut().on_shortcut(shortcut, |app, _shortcut, event| {
        // Only respond to key press (down), not release (up)
        use tauri_plugin_global_shortcut::ShortcutState;
        if event.state != ShortcutState::Pressed {
            return;
        }
        
        eprintln!("Global shortcut triggered!");
        if let Some(window) = app.get_webview_window("main") {
            match window.is_visible() {
                Ok(true) => {
                    let _ = window.hide();
                    // Update menu to show "Show"
                    let _ = update_tray_menu(app, false);
                }
                Ok(false) => {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.center();
                    // Update menu to show "Hide"
                    let _ = update_tray_menu(app, true);
                }
                Err(e) => {
                    eprintln!("Failed to check window visibility: {}", e);
                }
            }
        }
    }) {
        Ok(_) => {
            eprintln!("Global shortcut registered successfully!");
            Ok(())
        }
        Err(e) => {
            eprintln!("Failed to register global shortcut: {}", e);
            eprintln!("You can still open the window from the menu bar.");
            Ok(()) // Don't fail the app, just log the error
        }
    }
}
