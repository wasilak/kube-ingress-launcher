//! Kubernetes client and utilities.

pub mod client;
pub mod transform;

pub use client::Client;
pub use transform::transform_ingress;
