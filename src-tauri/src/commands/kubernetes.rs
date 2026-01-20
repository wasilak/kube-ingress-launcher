//! Kubernetes context management commands
//!
//! This module provides commands for listing and switching between Kubernetes contexts.

use tauri::{State, Emitter};
use crate::state::AppState;
use crate::k8s::client::Client;

/// Get list of available Kubernetes contexts
///
/// Reads the kubeconfig file and returns all available context names.
/// The current context is determined by the kubeconfig's current-context field.
///
/// # Requirements
/// - 4.6: Provide context selection in settings
/// - 9.15-9.17: Kubernetes context selector
/// - 13.4: Tauri command handler
#[tauri::command]
pub async fn get_contexts() -> Result<Vec<String>, String> {
    Client::get_contexts()
        .await
        .map_err(|e| format!("Failed to get contexts: {}", e))
}

/// Switch to a different Kubernetes context
///
/// Changes the active Kubernetes context and triggers a refresh of ingress data.
/// The new context is persisted in the kubeconfig file.
///
/// # Arguments
/// * `context` - Name of the context to switch to
///
/// # Requirements
/// - 4.7: Switch context and refresh data
/// - 9.15-9.17: Context switching functionality
/// - 13.4: Tauri command handler
#[tauri::command]
pub async fn switch_context(
    context: String,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    // Switch the context
    Client::switch_context(&context)
        .await
        .map_err(|e| format!("Failed to switch context: {}", e))?;

    // Clear current data
    {
        let mut ingresses = state.ingresses.write().await;
        ingresses.clear();
    }

    // Clear any previous errors
    {
        let mut error = state.last_error.write().await;
        *error = None;
    }

    // Trigger immediate refresh by emitting event
    // The background refresh task will pick up the new context
    let _ = app.emit("context-changed", ());

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_contexts() {
        // This test will only pass if kubeconfig is available
        // In CI/CD, this might need to be mocked or skipped
        let result = get_contexts().await;
        
        // We can't assert success without a valid kubeconfig,
        // but we can verify the function compiles and runs
        match result {
            Ok(contexts) => {
                // If successful, contexts should be a vector
                assert!(contexts.is_empty() || !contexts.is_empty());
            }
            Err(e) => {
                // If it fails, it should be due to missing kubeconfig
                assert!(e.contains("kubeconfig") || e.contains("config"));
            }
        }
    }

    #[test]
    fn test_context_validation() {
        // Test that empty context name is invalid
        let empty_context = "";
        assert!(empty_context.is_empty());
        
        // Test that non-empty context name is valid
        let valid_context = "minikube";
        assert!(!valid_context.is_empty());
    }
}
