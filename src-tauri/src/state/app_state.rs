//! Application state management
//!
//! This module defines the core data structures for managing application state,
//! including ingress data, error information, and shared state using Arc<RwLock<T>>
//! for thread-safe access across async tasks.

use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::usage::UsageTracker;

/// Represents a Kubernetes ingress resource with extracted information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngressData {
    /// Unique identifier (from Kubernetes UID)
    pub id: String,
    /// Ingress name
    pub name: String,
    /// Kubernetes namespace
    pub namespace: String,
    /// List of hosts from spec.rules[].host and spec.tls[].hosts
    pub hosts: Vec<String>,
    /// List of paths from spec.rules[].http.paths[].path
    pub paths: Vec<String>,
    /// Complete URLs constructed from protocol + host + path
    pub urls: Vec<String>,
    /// User-defined annotations (auto-generated ones filtered out)
    pub annotations: HashMap<String, String>,
    /// Creation timestamp in ISO 8601 format
    pub creation_timestamp: String,
    /// Whether TLS is configured
    pub tls: bool,
    /// Status of the ingress (currently always "unknown" for MVP)
    pub status: String,
    /// Optional labels from metadata
    pub labels: Option<HashMap<String, String>>,
}

/// Error information for display to users
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorInfo {
    /// User-friendly error message
    pub message: String,
    /// Optional detailed error information
    pub details: Option<String>,
    /// Timestamp when error occurred (ISO 8601 format)
    pub timestamp: String,
}

/// Application state shared across Tauri commands and background tasks
///
/// Uses Arc<RwLock<T>> for thread-safe access:
/// - Arc allows sharing across threads
/// - RwLock allows multiple readers or single writer
#[derive(Clone)]
pub struct AppState {
    /// Cached ingress data from Kubernetes
    pub ingresses: Arc<RwLock<Vec<IngressData>>>,
    /// Last error that occurred during refresh
    pub last_error: Arc<RwLock<Option<ErrorInfo>>>,
    /// Timestamp of last successful data fetch
    pub last_updated: Arc<RwLock<Option<DateTime<Utc>>>>,
    /// Usage tracking for link opens
    pub usage_tracker: Arc<UsageTracker>,
}

impl AppState {
    /// Creates a new AppState with empty initial values and initializes usage tracker
    ///
    /// # Arguments
    /// * `app_handle` - Tauri app handle for storage access
    ///
    /// # Errors
    /// Returns error if usage tracker initialization fails
    pub async fn new(app_handle: tauri::AppHandle) -> Result<Self, crate::error::AppError> {
        let usage_tracker = UsageTracker::new(app_handle).await?;
        
        Ok(Self {
            ingresses: Arc::new(RwLock::new(Vec::new())),
            last_error: Arc::new(RwLock::new(None)),
            last_updated: Arc::new(RwLock::new(None)),
            usage_tracker: Arc::new(usage_tracker),
        })
    }
}


#[cfg(test)]
mod tests {
    use super::*;

    // Helper to create a mock AppHandle for testing
    // Note: In real tests with Tauri, we'd use proper test infrastructure
    // For now, these tests are marked as ignored since they require Tauri runtime
    
    #[tokio::test]
    #[ignore] // Requires Tauri test infrastructure
    async fn test_app_state_new() {
        // This test would need a proper Tauri AppHandle
        // let app_handle = create_test_app_handle();
        // let state = AppState::new(app_handle).await.unwrap();
        // assert!(Arc::strong_count(&state.ingresses) >= 1);
    }

    #[tokio::test]
    #[ignore] // Requires Tauri test infrastructure
    async fn test_app_state_clone() {
        // This test would need a proper Tauri AppHandle
        // let app_handle = create_test_app_handle();
        // let state = AppState::new(app_handle).await.unwrap();
        // let cloned = state.clone();
        // assert!(Arc::strong_count(&state.ingresses) >= 2);
    }

    #[test]
    fn test_ingress_data_serialization() {
        let ingress = IngressData {
            id: "test-id".to_string(),
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
        };

        // Test serialization
        let json = serde_json::to_string(&ingress).unwrap();
        assert!(json.contains("test-ingress"));
        assert!(json.contains("example.com"));

        // Test deserialization
        let deserialized: IngressData = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.name, "test-ingress");
        assert_eq!(deserialized.namespace, "default");
        assert_eq!(deserialized.tls, true);
    }

    #[test]
    fn test_error_info_serialization() {
        let error = ErrorInfo {
            message: "Test error".to_string(),
            details: Some("Detailed information".to_string()),
            timestamp: "2024-01-15T10:30:00Z".to_string(),
        };

        // Test serialization
        let json = serde_json::to_string(&error).unwrap();
        assert!(json.contains("Test error"));
        assert!(json.contains("Detailed information"));

        // Test deserialization
        let deserialized: ErrorInfo = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.message, "Test error");
        assert_eq!(deserialized.details, Some("Detailed information".to_string()));
    }

    #[tokio::test]
    #[ignore] // Requires Tauri test infrastructure for AppState initialization
    async fn test_app_state_read_write() {
        // This test would need a proper Tauri AppHandle
        // let app_handle = create_test_app_handle();
        // let state = AppState::new(app_handle).await.unwrap();
        // ... rest of test
    }

    #[tokio::test]
    #[ignore] // Requires Tauri test infrastructure for AppState initialization
    async fn test_app_state_error_handling() {
        // This test would need a proper Tauri AppHandle
        // let app_handle = create_test_app_handle();
        // let state = AppState::new(app_handle).await.unwrap();
        // ... rest of test
    }

    #[tokio::test]
    #[ignore] // Requires Tauri test infrastructure for AppState initialization
    async fn test_app_state_timestamp() {
        // This test would need a proper Tauri AppHandle
        // let app_handle = create_test_app_handle();
        // let state = AppState::new(app_handle).await.unwrap();
        // ... rest of test
    }
}
