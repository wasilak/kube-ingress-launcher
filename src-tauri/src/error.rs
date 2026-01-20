//! Error types for the application.

use thiserror::Error;

/// Application error types.
#[derive(Debug, Error)]
pub enum AppError {
    /// Kubernetes-related errors.
    #[error("Kubernetes error: {0}")]
    KubernetesError(String),
    
    /// Settings-related errors.
    #[error("Settings error: {0}")]
    SettingsError(String),
    
    /// Permission-related errors.
    #[error("Permission error: {0}")]
    PermissionError(String),
    
    /// System-related errors.
    #[error("System error: {0}")]
    SystemError(String),
}

/// Convert AppError to String for Tauri commands.
impl From<AppError> for String {
    fn from(error: AppError) -> Self {
        error.to_string()
    }
}
