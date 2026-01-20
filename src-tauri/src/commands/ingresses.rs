//! Ingress-related Tauri commands
//!
//! This module provides commands for fetching ingress data and opening URLs.

use tauri::{State, Manager};
use serde::{Deserialize, Serialize};
use crate::state::{AppState, IngressData, ErrorInfo};

/// Response structure for get_ingresses command
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngressResponse {
    /// List of ingress resources
    pub ingresses: Vec<IngressData>,
    /// Last error that occurred, if any
    pub error: Option<ErrorInfo>,
    /// Timestamp of last successful update (ISO 8601 format)
    pub last_updated: Option<String>,
}

/// Get all cached ingress data
///
/// Returns the current cached ingress list along with any error information
/// and the timestamp of the last successful update.
///
/// # Requirements
/// - 7.1: Returns IngressResponse with cached data
/// - 7.2: Displays cached data immediately
/// - 13.4: Tauri command handler
#[tauri::command]
pub async fn get_ingresses(state: State<'_, AppState>) -> Result<IngressResponse, String> {
    let ingresses = state.ingresses.read().await;
    let last_error = state.last_error.read().await;
    let last_updated = state.last_updated.read().await;

    Ok(IngressResponse {
        ingresses: ingresses.clone(),
        error: last_error.clone(),
        last_updated: last_updated.map(|dt| dt.to_rfc3339()),
    })
}

/// Open a URL in the default system browser
///
/// Uses the tauri-plugin-opener to open URLs in the user's default browser.
/// Hides the application window after opening the URL.
///
/// # Arguments
/// * `url` - The URL to open
///
/// # Requirements
/// - 8.1-8.4: Opens URL in default browser
/// - 13.4: Tauri command handler
/// - 20.4.1: Update tray menu on window hide
#[tauri::command]
pub async fn open_url(url: String, app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    
    // Open URL in default browser
    app.opener()
        .open_url(&url, None::<&str>)
        .map_err(|e| format!("Failed to open URL: {}", e))?;
    
    // Hide the window after opening URL
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
    
    // Update tray menu to show "Show"
    use tauri::menu::{Menu, MenuItemBuilder};
    
    let show_item = MenuItemBuilder::with_id("show", "Show (⌘⇧K)")
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

    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_menu(Some(menu));
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[tokio::test]
    async fn test_ingress_response_serialization() {
        let response = IngressResponse {
            ingresses: vec![],
            error: None,
            last_updated: None,
        };
        
        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("ingresses"));
    }

    #[tokio::test]
    async fn test_ingress_response_with_data() {
        let response = IngressResponse {
            ingresses: vec![IngressData {
                id: "test-1".to_string(),
                name: "test-ingress".to_string(),
                namespace: "default".to_string(),
                hosts: vec!["example.com".to_string()],
                paths: vec!["/api".to_string()],
                urls: vec!["https://example.com/api".to_string()],
                annotations: HashMap::new(),
                creation_timestamp: "2024-01-15T10:30:00Z".to_string(),
                tls: true,
                status: "unknown".to_string(),
                labels: None,
            }],
            error: None,
            last_updated: Some("2024-01-15T10:30:00Z".to_string()),
        };
        
        assert_eq!(response.ingresses.len(), 1);
        assert_eq!(response.ingresses[0].name, "test-ingress");
    }

    #[tokio::test]
    async fn test_ingress_response_with_error() {
        let response = IngressResponse {
            ingresses: vec![],
            error: Some(ErrorInfo {
                message: "Test error".to_string(),
                details: Some("Details".to_string()),
                timestamp: "2024-01-15T10:30:00Z".to_string(),
            }),
            last_updated: None,
        };
        
        assert!(response.error.is_some());
        assert_eq!(response.error.unwrap().message, "Test error");
    }
}
