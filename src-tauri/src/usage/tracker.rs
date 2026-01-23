//! Usage tracking implementation for recording and managing link open events.

use super::{UsageDatapoint, UsageStats};
use crate::error::AppError;
use chrono::{Duration, Utc};
use std::sync::Arc;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;
use tokio::sync::RwLock;

/// Storage file name for usage statistics
const USAGE_STATS_FILE: &str = "usage_stats.json";

/// Storage key for datapoints
const DATAPOINTS_KEY: &str = "datapoints";

/// Maximum age of datapoints in days
const MAX_DATAPOINT_AGE_DAYS: i64 = 30;

/// Manages usage tracking operations
pub struct UsageTracker {
    /// Shared usage statistics
    stats: Arc<RwLock<UsageStats>>,
    /// Tauri app handle for storage access
    app_handle: AppHandle,
}

impl UsageTracker {
    /// Create new tracker and load from storage
    pub async fn new(app_handle: AppHandle) -> Result<Self, AppError> {
        let stats = Self::load(&app_handle).await?;

        Ok(Self {
            stats: Arc::new(RwLock::new(stats)),
            app_handle,
        })
    }

    /// Record a link open event
    pub async fn record_open(&self, host: String) -> Result<(), AppError> {
        let datapoint = UsageDatapoint {
            host,
            timestamp: Utc::now(),
        };

        {
            let mut stats = self.stats.write().await;
            stats.datapoints.push(datapoint);
        }

        self.save().await?;
        Ok(())
    }

    /// Remove datapoints older than 30 days
    pub async fn cleanup_old_datapoints(&self) -> Result<usize, AppError> {
        let cutoff = Utc::now() - Duration::days(MAX_DATAPOINT_AGE_DAYS);

        let removed_count = {
            let mut stats = self.stats.write().await;
            let original_len = stats.datapoints.len();

            stats.datapoints.retain(|datapoint| {
                datapoint.timestamp >= cutoff
            });

            original_len - stats.datapoints.len()
        };

        if removed_count > 0 {
            self.save().await?;
        }

        Ok(removed_count)
    }

    /// Clear all datapoints for a specific host
    pub async fn clear_host(&self, host: String) -> Result<(), AppError> {
        {
            let mut stats = self.stats.write().await;
            stats.datapoints.retain(|datapoint| datapoint.host != host);
        }

        self.save().await?;
        Ok(())
    }

    /// Clear all datapoints
    pub async fn clear_all(&self) -> Result<(), AppError> {
        {
            let mut stats = self.stats.write().await;
            stats.datapoints.clear();
        }

        self.save().await?;
        Ok(())
    }

    /// Get a read-only reference to the stats
    pub async fn get_stats(&self) -> UsageStats {
        let stats = self.stats.read().await;
        stats.clone()
    }

    /// Persist to storage
    async fn save(&self) -> Result<(), AppError> {
        let stats = self.stats.read().await;

        let store = self
            .app_handle
            .store(USAGE_STATS_FILE)
            .map_err(|e| AppError::SettingsError(format!("Failed to access store: {}", e)))?;

        store.set(
            DATAPOINTS_KEY,
            serde_json::to_value(&stats.datapoints)
                .map_err(|e| AppError::SettingsError(format!("Failed to serialize datapoints: {}", e)))?,
        );

        store
            .save()
            .map_err(|e| AppError::SettingsError(format!("Failed to save usage stats: {}", e)))?;

        Ok(())
    }

    /// Load from storage
    async fn load(app_handle: &AppHandle) -> Result<UsageStats, AppError> {
        let store = match app_handle.store(USAGE_STATS_FILE) {
            Ok(store) => store,
            Err(e) => {
                eprintln!(
                    "Failed to access usage stats store: {}. Starting with empty stats.",
                    e
                );
                return Ok(UsageStats::new());
            }
        };

        let datapoints: Vec<UsageDatapoint> = match store.get(DATAPOINTS_KEY) {
            Some(value) => serde_json::from_value(value.clone()).unwrap_or_else(|e| {
                eprintln!(
                    "Failed to deserialize usage datapoints: {}. Starting with empty stats.",
                    e
                );
                Vec::new()
            }),
            None => Vec::new(),
        };

        Ok(UsageStats { datapoints })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Helper to create a test tracker without storage
    fn create_test_tracker() -> (UsageTracker, AppHandle) {
        // Note: This is a placeholder for testing
        // In real tests, we'd need to create a proper test AppHandle
        todo!("Test helpers require Tauri test infrastructure")
    }

    #[tokio::test]
    #[ignore] // Requires Tauri test infrastructure
    async fn test_record_open_creates_datapoint() {
        let (_tracker, _app) = create_test_tracker();

        // This test would need proper Tauri test infrastructure
        // tracker.record_open("example.com".to_string()).await.unwrap();
        // let stats = tracker.get_stats().await;
        // assert_eq!(stats.datapoints.len(), 1);
        // assert_eq!(stats.datapoints[0].host, "example.com");
        todo!("Implement with proper test infrastructure")
    }

    #[tokio::test]
    #[ignore] // Requires Tauri test infrastructure
    async fn test_cleanup_removes_old_datapoints() {
        let (_tracker, _app) = create_test_tracker();

        // This test would need to manually add old datapoints
        // and verify cleanup works correctly
        todo!("Implement with proper test infrastructure")
    }

    #[tokio::test]
    #[ignore] // Requires Tauri test infrastructure
    async fn test_clear_host_removes_only_that_host() {
        let (_tracker, _app) = create_test_tracker();

        // This test would need proper Tauri test infrastructure
        // tracker.record_open("host1.com".to_string()).await.unwrap();
        // tracker.record_open("host2.com".to_string()).await.unwrap();
        // tracker.clear_host("host1.com".to_string()).await.unwrap();
        // let stats = tracker.get_stats().await;
        // assert_eq!(stats.datapoints.len(), 1);
        // assert_eq!(stats.datapoints[0].host, "host2.com");
        todo!("Implement with proper test infrastructure")
    }

    #[tokio::test]
    #[ignore] // Requires Tauri test infrastructure
    async fn test_clear_all_removes_all_datapoints() {
        let (_tracker, _app) = create_test_tracker();

        // This test would need proper Tauri test infrastructure
        // tracker.record_open("host1.com".to_string()).await.unwrap();
        // tracker.record_open("host2.com".to_string()).await.unwrap();
        // tracker.clear_all().await.unwrap();
        // let stats = tracker.get_stats().await;
        // assert_eq!(stats.datapoints.len(), 0);
        todo!("Implement with proper test infrastructure")
    }
}
