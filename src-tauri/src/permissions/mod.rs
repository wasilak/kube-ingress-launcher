/// macOS Permissions Management
///
/// This module handles macOS-specific permissions including:
/// - Accessibility permissions for global shortcuts
/// - Login item registration for autostart
///
/// Requirements: 10.1-10.5
pub mod accessibility;
pub mod autostart;

pub use accessibility::{check_accessibility_permission, request_accessibility_permission};
pub use autostart::{enable_autostart, disable_autostart, is_autostart_enabled};
