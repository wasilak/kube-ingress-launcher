//! Background refresh task for fetching Kubernetes ingress data.
//!
//! This module implements a periodic background task that:
//! - Fetches ingress resources from Kubernetes every 60 seconds (configurable)
//! - Transforms them into our internal format
//! - Updates the application state
//! - Handles errors gracefully with exponential backoff
//! - Emits events to notify the frontend of updates
//!
//! Requirements: 6.1-6.11, 13.6

use tokio::time::{interval, Duration, sleep};
use crate::k8s::client::Client;
use crate::k8s::transform::{transform_ingress, split_ingress_by_host};
use crate::state::{AppState, ErrorInfo};
use chrono::Utc;
use tauri::{AppHandle, Manager, Emitter};

/// Default refresh interval in seconds
const DEFAULT_REFRESH_INTERVAL_SECS: u64 = 60;

/// Maximum backoff delay in seconds
const MAX_BACKOFF_SECS: u64 = 5;

/// Starts the background refresh task that periodically fetches ingress data.
///
/// This function spawns an async task that:
/// 1. Performs an initial fetch on startup (Requirement 6.2)
/// 2. Fetches ingress data every 60 seconds (Requirement 6.3)
/// 3. Updates the application state with new data (Requirement 6.4, 6.5)
/// 4. Handles errors gracefully with exponential backoff (Requirement 6.7, 6.8, 6.11)
/// 5. Emits "ingresses-updated" events to the frontend (Requirement 6.6)
///
/// # Arguments
///
/// * `app_handle` - Handle to the Tauri application for accessing state and emitting events
///
/// # Requirements
///
/// Implements requirements 6.1-6.11, 13.6
pub async fn start_refresh_task(app_handle: AppHandle) {
    // Get the application state
    let state = app_handle.state::<AppState>();
    
    // Perform initial fetch before allowing window to be shown (Requirement 6.2)
    if let Err(e) = fetch_and_update(&app_handle, &state).await {
        eprintln!("Initial fetch failed: {}", e);
    }

    // Start periodic refresh loop
    let mut interval = interval(Duration::from_secs(DEFAULT_REFRESH_INTERVAL_SECS));
    let mut backoff_delay = 100; // Start with 100ms backoff

    loop {
        interval.tick().await;

        match fetch_and_update(&app_handle, &state).await {
            Ok(_) => {
                // Reset backoff on success
                backoff_delay = 100;
            }
            Err(e) => {
                eprintln!("Background refresh failed: {}", e);
                
                // Implement exponential backoff (Requirement 6.11)
                sleep(Duration::from_millis(backoff_delay)).await;
                backoff_delay = (backoff_delay * 2).min(MAX_BACKOFF_SECS * 1000);
            }
        }
    }
}

/// Fetches ingress data from Kubernetes and updates the application state.
///
/// This function:
/// 1. Creates a Kubernetes client
/// 2. Fetches all ingress resources from all namespaces (Requirement 6.1)
/// 3. Transforms them into our internal format
/// 4. Updates the application state (Requirement 6.4)
/// 5. Clears any previous errors on success (Requirement 6.6)
/// 6. Stores errors on failure while preserving cached data (Requirement 6.7, 6.8)
/// 7. Emits events to notify the frontend
///
/// # Arguments
///
/// * `app_handle` - Handle to the Tauri application for emitting events
/// * `state` - Application state to update
///
/// # Returns
///
/// Returns `Ok(())` on success, or an error message on failure
///
/// # Requirements
///
/// Implements requirements 6.1, 6.4-6.8, 11.1, 11.2, 11.7
pub async fn fetch_and_update(
    app_handle: &AppHandle,
    state: &AppState,
) -> Result<(), String> {
    // Create Kubernetes client
    let client = Client::new().await
        .map_err(|e| {
            let error_msg = format!("Failed to connect to Kubernetes: {}", e);
            
            // Check if this is an authentication error
            let is_auth_error = error_msg.contains("401") || error_msg.contains("Unauthorized");
            
            // Store error in state (Requirement 6.8, 11.1, 11.2)
            let error_info = ErrorInfo {
                message: if is_auth_error {
                    format!("Authentication failed: {}. Please check your kubeconfig credentials and ensure you have valid authentication tokens.", e)
                } else {
                    error_msg.clone()
                },
                details: Some(format!("{:?}", e)),
                timestamp: Utc::now().to_rfc3339(),
            };
            
            // Update error state asynchronously (Requirement 11.7 - continue running with cached data)
            let state = state.clone();
            tauri::async_runtime::spawn(async move {
                let mut last_error = state.last_error.write().await;
                *last_error = Some(error_info);
            });
            
            eprintln!("Kubernetes connection error: {}", error_msg);
            eprintln!("Application will continue running with cached data if available.");
            
            error_msg
        })?;

    // Fetch all ingresses from all namespaces (Requirement 6.1)
    let k8s_ingresses = client.list_ingresses().await
        .map_err(|e| {
            let error_msg = format!("Failed to fetch ingresses: {}", e);
            
            // Check if this is an authentication error (Requirement 11.1, 11.2)
            let is_auth_error = error_msg.contains("401") || error_msg.contains("Unauthorized");
            let is_forbidden = error_msg.contains("403") || error_msg.contains("Forbidden");
            let is_connectivity = error_msg.contains("connection") || error_msg.contains("timeout");
            
            // Store error in state (Requirement 6.8, 11.7)
            let error_info = ErrorInfo {
                message: if is_auth_error {
                    "Authentication failed (401 Unauthorized). Please check your kubeconfig credentials and ensure you have valid authentication tokens.".to_string()
                } else if is_forbidden {
                    "Access forbidden (403). Your credentials are valid but you don't have permission to list ingresses.".to_string()
                } else if is_connectivity {
                    format!("Network connectivity issue: {}. Please check your cluster connectivity.", e)
                } else {
                    error_msg.clone()
                },
                details: Some(format!("{:?}", e)),
                timestamp: Utc::now().to_rfc3339(),
            };
            
            // Update error state asynchronously (Requirement 11.7 - continue running with cached data)
            let state = state.clone();
            tauri::async_runtime::spawn(async move {
                let mut last_error = state.last_error.write().await;
                *last_error = Some(error_info);
            });
            
            eprintln!("Kubernetes API error: {}", error_msg);
            eprintln!("Application will continue running with cached data if available.");
            
            error_msg
        })?;

    // Transform ingresses into our internal format and split by host
    let ingresses: Vec<_> = k8s_ingresses
        .iter()
        .map(transform_ingress)
        .flat_map(|ingress| split_ingress_by_host(&ingress))
        .collect();

    // Update state with new data (Requirement 6.4)
    {
        let mut state_ingresses = state.ingresses.write().await;
        *state_ingresses = ingresses;
    }

    // Update last_updated timestamp
    {
        let mut last_updated = state.last_updated.write().await;
        *last_updated = Some(Utc::now());
    }

    // Clear any previous errors on success (Requirement 6.6)
    {
        let mut last_error = state.last_error.write().await;
        *last_error = None;
    }

    // Emit event to frontend to notify of update (Requirement 6.6)
    let _ = app_handle.emit("ingresses-updated", ());

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_constants() {
        assert_eq!(DEFAULT_REFRESH_INTERVAL_SECS, 60);
        assert_eq!(MAX_BACKOFF_SECS, 5);
    }

    // Note: Integration tests for the refresh task would require:
    // - A mock Kubernetes cluster or test environment
    // - A way to inject a test client
    // - Async test runtime setup
    // These are better suited for integration tests rather than unit tests
}
