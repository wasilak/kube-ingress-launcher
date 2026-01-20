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
}

impl AppState {
    /// Creates a new AppState with empty initial values
    pub fn new() -> Self {
        Self {
            ingresses: Arc::new(RwLock::new(Vec::new())),
            last_error: Arc::new(RwLock::new(None)),
            last_updated: Arc::new(RwLock::new(None)),
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_state_new() {
        let state = AppState::new();
        // State should be created successfully
        // We can't directly test the contents without async runtime,
        // but we can verify it compiles and constructs
        assert!(Arc::strong_count(&state.ingresses) >= 1);
        assert!(Arc::strong_count(&state.last_error) >= 1);
        assert!(Arc::strong_count(&state.last_updated) >= 1);
    }

    #[test]
    fn test_app_state_clone() {
        let state = AppState::new();
        let cloned = state.clone();
        
        // Cloning should increase Arc reference counts
        assert!(Arc::strong_count(&state.ingresses) >= 2);
        assert!(Arc::strong_count(&cloned.ingresses) >= 2);
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
    async fn test_app_state_read_write() {
        let state = AppState::new();

        // Test writing ingresses
        {
            let mut ingresses = state.ingresses.write().await;
            ingresses.push(IngressData {
                id: "test-1".to_string(),
                name: "test-ingress".to_string(),
                namespace: "default".to_string(),
                hosts: vec!["example.com".to_string()],
                paths: vec!["/".to_string()],
                urls: vec!["https://example.com/".to_string()],
                annotations: HashMap::new(),
                creation_timestamp: "2024-01-15T10:30:00Z".to_string(),
                tls: true,
                status: "unknown".to_string(),
                labels: None,
            });
        }

        // Test reading ingresses
        {
            let ingresses = state.ingresses.read().await;
            assert_eq!(ingresses.len(), 1);
            assert_eq!(ingresses[0].name, "test-ingress");
        }
    }

    #[tokio::test]
    async fn test_app_state_error_handling() {
        let state = AppState::new();

        // Initially no error
        {
            let error = state.last_error.read().await;
            assert!(error.is_none());
        }

        // Set an error
        {
            let mut error = state.last_error.write().await;
            *error = Some(ErrorInfo {
                message: "Test error".to_string(),
                details: None,
                timestamp: "2024-01-15T10:30:00Z".to_string(),
            });
        }

        // Read the error
        {
            let error = state.last_error.read().await;
            assert!(error.is_some());
            assert_eq!(error.as_ref().unwrap().message, "Test error");
        }

        // Clear the error
        {
            let mut error = state.last_error.write().await;
            *error = None;
        }

        // Verify cleared
        {
            let error = state.last_error.read().await;
            assert!(error.is_none());
        }
    }

    #[tokio::test]
    async fn test_app_state_timestamp() {
        let state = AppState::new();

        // Initially no timestamp
        {
            let timestamp = state.last_updated.read().await;
            assert!(timestamp.is_none());
        }

        // Set timestamp
        let now = Utc::now();
        {
            let mut timestamp = state.last_updated.write().await;
            *timestamp = Some(now);
        }

        // Read timestamp
        {
            let timestamp = state.last_updated.read().await;
            assert!(timestamp.is_some());
            assert_eq!(timestamp.unwrap(), now);
        }
    }
}
