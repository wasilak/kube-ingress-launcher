//! Tauri commands for usage tracking functionality.
//!
//! This module provides commands for recording link opens, retrieving usage statistics,
//! and managing usage data. All commands emit "usage-stats-updated" events after mutations
//! to notify the frontend of changes.

use crate::state::AppState;
use crate::usage::{AggregatedUsage, TimeRange, UsageAggregator};
use std::collections::HashMap;
use tauri::{AppHandle, Emitter, State};

/// Record a link open event
///
/// # Arguments
/// * `host` - The ingress host that was opened
/// * `state` - Application state containing usage tracker
/// * `app_handle` - Tauri app handle for emitting events
///
/// # Returns
/// * `Ok(())` on success
/// * `Err(String)` with error message on failure
#[tauri::command]
pub async fn record_link_open(
    host: String,
    state: State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<(), String> {
    // Validate input
    if host.is_empty() {
        eprintln!("Error: Attempted to record link open with empty host");
        return Err("Host cannot be empty".to_string());
    }

    if host.len() > 253 {
        eprintln!("Error: Host too long: {} characters", host.len());
        return Err("Host name too long (max 253 characters)".to_string());
    }

    // Record the open event
    state
        .usage_tracker
        .record_open(host.clone())
        .await
        .map_err(|e| {
            eprintln!("Error recording link open for host '{}': {}", host, e);
            format!("Failed to record link open: {}", e)
        })?;

    // Emit update event (log but don't fail if emit fails)
    if let Err(e) = app_handle.emit("usage-stats-updated", ()) {
        eprintln!("Warning: Failed to emit usage-stats-updated event: {}", e);
    }

    Ok(())
}

/// Get aggregated usage statistics for all hosts
///
/// # Arguments
/// * `time_range` - Time range for aggregation
/// * `state` - Application state containing usage tracker
///
/// # Returns
/// * `Ok(Vec<AggregatedUsage>)` with aggregated statistics
/// * `Err(String)` with error message on failure
#[tauri::command]
pub async fn get_usage_stats(
    time_range: TimeRange,
    state: State<'_, AppState>,
) -> Result<Vec<AggregatedUsage>, String> {
    let stats = state.usage_tracker.get_stats().await;

    let aggregated = UsageAggregator::aggregate(&stats.datapoints, time_range);

    Ok(aggregated)
}

/// Get aggregated usage for a specific host
///
/// # Arguments
/// * `host` - The ingress host to get usage for
/// * `time_range` - Time range for aggregation
/// * `state` - Application state containing usage tracker
///
/// # Returns
/// * `Ok(AggregatedUsage)` with aggregated statistics for the host
/// * `Err(String)` with error message on failure
#[tauri::command]
pub async fn get_host_usage(
    host: String,
    time_range: TimeRange,
    state: State<'_, AppState>,
) -> Result<AggregatedUsage, String> {
    // Validate input
    if host.is_empty() {
        eprintln!("Error: Attempted to get host usage with empty host");
        return Err("Host cannot be empty".to_string());
    }

    if host.len() > 253 {
        eprintln!("Error: Host too long: {} characters", host.len());
        return Err("Host name too long (max 253 characters)".to_string());
    }

    let stats = state.usage_tracker.get_stats().await;

    let aggregated = UsageAggregator::aggregate_host(&stats.datapoints, &host, time_range);

    Ok(aggregated)
}

/// Clear usage statistics for a specific host
///
/// # Arguments
/// * `host` - The ingress host to clear usage for
/// * `state` - Application state containing usage tracker
/// * `app_handle` - Tauri app handle for emitting events
///
/// # Returns
/// * `Ok(())` on success
/// * `Err(String)` with error message on failure
#[tauri::command]
pub async fn clear_host_usage(
    host: String,
    state: State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<(), String> {
    // Validate input
    if host.is_empty() {
        eprintln!("Error: Attempted to clear host usage with empty host");
        return Err("Host cannot be empty".to_string());
    }

    if host.len() > 253 {
        eprintln!("Error: Host too long: {} characters", host.len());
        return Err("Host name too long (max 253 characters)".to_string());
    }

    // Clear the host
    state
        .usage_tracker
        .clear_host(host.clone())
        .await
        .map_err(|e| {
            eprintln!("Error clearing usage for host '{}': {}", host, e);
            format!("Failed to clear host usage: {}", e)
        })?;

    // Emit update event (log but don't fail if emit fails)
    if let Err(e) = app_handle.emit("usage-stats-updated", ()) {
        eprintln!("Warning: Failed to emit usage-stats-updated event: {}", e);
    }

    Ok(())
}

/// Clear all usage statistics
///
/// # Arguments
/// * `state` - Application state containing usage tracker
/// * `app_handle` - Tauri app handle for emitting events
///
/// # Returns
/// * `Ok(())` on success
/// * `Err(String)` with error message on failure
#[tauri::command]
pub async fn clear_all_usage(
    state: State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<(), String> {
    // Clear all datapoints
    state
        .usage_tracker
        .clear_all()
        .await
        .map_err(|e| {
            eprintln!("Error clearing all usage statistics: {}", e);
            format!("Failed to clear all usage: {}", e)
        })?;

    // Emit update event (log but don't fail if emit fails)
    if let Err(e) = app_handle.emit("usage-stats-updated", ()) {
        eprintln!("Warning: Failed to emit usage-stats-updated event: {}", e);
    }

    Ok(())
}

/// Get usage count for a specific host
///
/// # Arguments
/// * `host` - The ingress host to get count for
/// * `state` - Application state containing usage tracker
///
/// # Returns
/// * `Ok(u32)` with the count of opens for the host
/// * `Err(String)` with error message on failure
#[tauri::command]
pub async fn get_host_count(host: String, state: State<'_, AppState>) -> Result<u32, String> {
    // Validate input
    if host.is_empty() {
        eprintln!("Error: Attempted to get host count with empty host");
        return Err("Host cannot be empty".to_string());
    }

    if host.len() > 253 {
        eprintln!("Error: Host too long: {} characters", host.len());
        return Err("Host name too long (max 253 characters)".to_string());
    }

    let stats = state.usage_tracker.get_stats().await;

    let count = stats
        .datapoints
        .iter()
        .filter(|dp| dp.host == host)
        .count() as u32;

    Ok(count)
}

/// Get usage counts for all hosts
///
/// # Arguments
/// * `state` - Application state containing usage tracker
///
/// # Returns
/// * `Ok(HashMap<String, u32>)` with counts for all hosts
/// * `Err(String)` with error message on failure
#[tauri::command]
pub async fn get_all_counts(
    state: State<'_, AppState>,
) -> Result<HashMap<String, u32>, String> {
    let stats = state.usage_tracker.get_stats().await;

    let mut counts: HashMap<String, u32> = HashMap::new();

    for datapoint in &stats.datapoints {
        *counts.entry(datapoint.host.clone()).or_insert(0) += 1;
    }

    Ok(counts)
}

#[cfg(test)]
mod tests {
    // Note: These tests require Tauri test infrastructure to create proper AppHandle and State
    // They are marked as ignored and serve as documentation for the expected behavior

    #[tokio::test]
    #[ignore]
    async fn test_record_link_open_validates_empty_host() {
        // This test would need proper Tauri test setup
        // let (state, app_handle) = create_test_state_and_handle();
        // let result = record_link_open("".to_string(), state, app_handle).await;
        // assert!(result.is_err());
        // assert!(result.unwrap_err().contains("Host cannot be empty"));
    }

    #[tokio::test]
    #[ignore]
    async fn test_record_link_open_success() {
        // This test would need proper Tauri test setup
        // let (state, app_handle) = create_test_state_and_handle();
        // let result = record_link_open("example.com".to_string(), state, app_handle).await;
        // assert!(result.is_ok());
    }

    #[tokio::test]
    #[ignore]
    async fn test_get_usage_stats_returns_aggregated_data() {
        // This test would need proper Tauri test setup
        // let (state, _) = create_test_state_and_handle();
        // let result = get_usage_stats(TimeRange::OneDay, state).await;
        // assert!(result.is_ok());
    }

    #[tokio::test]
    #[ignore]
    async fn test_get_host_usage_validates_empty_host() {
        // This test would need proper Tauri test setup
        // let (state, _) = create_test_state_and_handle();
        // let result = get_host_usage("".to_string(), TimeRange::OneDay, state).await;
        // assert!(result.is_err());
    }

    #[tokio::test]
    #[ignore]
    async fn test_clear_host_usage_validates_empty_host() {
        // This test would need proper Tauri test setup
        // let (state, app_handle) = create_test_state_and_handle();
        // let result = clear_host_usage("".to_string(), state, app_handle).await;
        // assert!(result.is_err());
    }

    #[tokio::test]
    #[ignore]
    async fn test_get_host_count_validates_empty_host() {
        // This test would need proper Tauri test setup
        // let (state, _) = create_test_state_and_handle();
        // let result = get_host_count("".to_string(), state).await;
        // assert!(result.is_err());
    }

    #[tokio::test]
    #[ignore]
    async fn test_get_all_counts_returns_hashmap() {
        // This test would need proper Tauri test setup
        // let (state, _) = create_test_state_and_handle();
        // let result = get_all_counts(state).await;
        // assert!(result.is_ok());
    }
}
