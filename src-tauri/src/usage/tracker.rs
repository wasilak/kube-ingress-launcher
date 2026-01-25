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
        // Validate host
        if host.is_empty() {
            eprintln!("Error: Attempted to record open with empty host");
            return Err(AppError::SettingsError("Host cannot be empty".to_string()));
        }

        if host.len() > 253 {
            eprintln!("Error: Host too long: {} characters", host.len());
            return Err(AppError::SettingsError("Host name too long".to_string()));
        }

        let datapoint = UsageDatapoint {
            host: host.clone(),
            timestamp: Utc::now(),
        };

        {
            let mut stats = self.stats.write().await;
            stats.datapoints.push(datapoint);
        }

        // Save to storage, but log error and continue if save fails
        if let Err(e) = self.save().await {
            eprintln!("Warning: Failed to save usage stats after recording open for '{}': {}", host, e);
            // Don't return error - the datapoint is in memory and will be saved on next successful save
        }

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
            // Save to storage, but log error and continue if save fails
            if let Err(e) = self.save().await {
                eprintln!("Warning: Failed to save usage stats after cleanup: {}", e);
                // Don't return error - cleanup succeeded in memory
            }
        }

        Ok(removed_count)
    }

    /// Clear all datapoints for a specific host
    pub async fn clear_host(&self, host: String) -> Result<(), AppError> {
        // Validate host
        if host.is_empty() {
            eprintln!("Error: Attempted to clear host with empty host");
            return Err(AppError::SettingsError("Host cannot be empty".to_string()));
        }

        {
            let mut stats = self.stats.write().await;
            stats.datapoints.retain(|datapoint| datapoint.host != host);
        }

        // Save to storage, but log error and continue if save fails
        if let Err(e) = self.save().await {
            eprintln!("Warning: Failed to save usage stats after clearing host '{}': {}", host, e);
            // Don't return error - clear succeeded in memory
        }

        Ok(())
    }

    /// Clear all datapoints
    pub async fn clear_all(&self) -> Result<(), AppError> {
        {
            let mut stats = self.stats.write().await;
            stats.datapoints.clear();
        }

        // Save to storage, but log error and continue if save fails
        if let Err(e) = self.save().await {
            eprintln!("Warning: Failed to save usage stats after clearing all: {}", e);
            // Don't return error - clear succeeded in memory
        }

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
            .map_err(|e| {
                eprintln!("Error accessing usage stats store: {}", e);
                AppError::SettingsError(format!("Failed to access store: {}", e))
            })?;

        let serialized = serde_json::to_value(&stats.datapoints)
            .map_err(|e| {
                eprintln!("Error serializing usage datapoints: {}", e);
                AppError::SettingsError(format!("Failed to serialize datapoints: {}", e))
            })?;

        store.set(DATAPOINTS_KEY, serialized);

        store
            .save()
            .map_err(|e| {
                eprintln!("Error saving usage stats to disk: {}", e);
                AppError::SettingsError(format!("Failed to save usage stats: {}", e))
            })?;

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
    // Note: These tests require Tauri test infrastructure to create a proper AppHandle
    // and test store. They are marked as #[ignore] until proper test infrastructure
    // is set up. The UsageTracker functionality is tested through integration tests
    // and manual testing.

    #[tokio::test]
    #[ignore = "Requires Tauri test infrastructure with mock AppHandle and store"]
    async fn test_record_open_creates_datapoint() {
        // This test would verify that record_open() creates a datapoint:
        // 1. Create test tracker with mock AppHandle
        // 2. Call tracker.record_open("example.com")
        // 3. Verify stats.datapoints.len() == 1
        // 4. Verify datapoint.host == "example.com"
    }

    #[tokio::test]
    #[ignore = "Requires Tauri test infrastructure with mock AppHandle and store"]
    async fn test_cleanup_removes_old_datapoints() {
        // This test would verify that cleanup_old_datapoints() removes old entries:
        // 1. Create test tracker with mock AppHandle
        // 2. Manually add datapoints with old timestamps
        // 3. Call tracker.cleanup_old_datapoints()
        // 4. Verify only recent datapoints remain
    }

    #[tokio::test]
    #[ignore = "Requires Tauri test infrastructure with mock AppHandle and store"]
    async fn test_clear_host_removes_only_that_host() {
        // This test would verify that clear_host() removes only specified host:
        // 1. Create test tracker with mock AppHandle
        // 2. Record opens for "host1.com" and "host2.com"
        // 3. Call tracker.clear_host("host1.com")
        // 4. Verify only "host2.com" datapoints remain
    }

    #[tokio::test]
    #[ignore = "Requires Tauri test infrastructure with mock AppHandle and store"]
    async fn test_clear_all_removes_all_datapoints() {
        // This test would verify that clear_all() removes all datapoints:
        // 1. Create test tracker with mock AppHandle
        // 2. Record opens for multiple hosts
        // 3. Call tracker.clear_all()
        // 4. Verify stats.datapoints.len() == 0
    }
}
