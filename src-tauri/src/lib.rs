// Application modules
pub mod state;
pub mod k8s;
pub mod error;
pub mod refresh;
pub mod commands;
pub mod settings;

use tauri::Manager;
use state::AppState;
use settings::SettingsState;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            // Initialize application state
            let app_state = AppState::new();
            app.manage(app_state);

            // Initialize settings state
            let settings_state = SettingsState::new();
            app.manage(settings_state);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::ingresses::get_ingresses,
            commands::ingresses::open_url,
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::kubernetes::get_contexts,
            commands::kubernetes::switch_context,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
