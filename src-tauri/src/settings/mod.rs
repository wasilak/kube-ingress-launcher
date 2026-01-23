//! Settings management module
//!
//! This module provides settings persistence and management functionality
//! using tauri-plugin-store.

pub mod store;

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Application settings structure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    /// Global keyboard shortcut (e.g., "CmdOrCtrl+Shift+K")
    pub global_shortcut: String,
    /// Refresh interval in seconds (10-3600)
    pub refresh_interval_secs: u64,
    /// Whether to start application on system login
    pub autostart: bool,
    /// Active Kubernetes context
    pub kube_context: String,
    /// Theme mode: "light", "dark", or "system"
    pub theme: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            global_shortcut: "CmdOrCtrl+Shift+K".to_string(),
            refresh_interval_secs: 60,
            autostart: false,
            kube_context: String::new(),
            theme: "system".to_string(),
        }
    }
}

/// Settings state wrapper for thread-safe access
#[derive(Clone)]
pub struct SettingsState {
    pub settings: Arc<RwLock<Settings>>,
}

impl SettingsState {
    pub fn new() -> Self {
        Self {
            settings: Arc::new(RwLock::new(Settings::default())),
        }
    }
}

impl Default for SettingsState {
    fn default() -> Self {
        Self::new()
    }
}
