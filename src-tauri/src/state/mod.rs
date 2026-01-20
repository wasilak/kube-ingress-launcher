//! State management module
//!
//! This module provides application state structures and management
//! for the Kubernetes ingress desktop application.

mod app_state;

pub use app_state::{AppState, ErrorInfo, IngressData};
