//! Kubernetes client for interacting with the Kubernetes API.

use kube::{Client as KubeClient, Api, Config};
use k8s_openapi::api::networking::v1::Ingress;
use crate::error::AppError;

/// Kubernetes client wrapper.
pub struct Client {
    client: KubeClient,
    config: Config,
}

impl Client {
    /// Creates a new Kubernetes client by inferring configuration from the environment.
    ///
    /// This will attempt to load configuration from:
    /// - KUBECONFIG environment variable
    /// - ~/.kube/config file
    /// - In-cluster configuration (if running in a pod)
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - Kubeconfig cannot be found or is invalid
    /// - Client cannot be created from the configuration
    pub async fn new() -> Result<Self, AppError> {
        let config = Config::infer().await
            .map_err(|e| AppError::KubernetesError(format!("Failed to load kubeconfig: {}", e)))?;
        
        let client = KubeClient::try_from(config.clone())
            .map_err(|e| AppError::KubernetesError(format!("Failed to create client: {}", e)))?;

        Ok(Self { client, config })
    }

    /// Lists all ingress resources across all namespaces.
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - The Kubernetes API request fails
    /// - Authentication fails
    /// - Network connectivity issues occur
    pub async fn list_ingresses(&self) -> Result<Vec<Ingress>, AppError> {
        let ingresses: Api<Ingress> = Api::all(self.client.clone());
        
        let list = ingresses.list(&Default::default()).await
            .map_err(|e| AppError::KubernetesError(format!("Failed to list ingresses: {}", e)))?;

        Ok(list.items)
    }

    /// Gets the current Kubernetes context cluster URL.
    ///
    /// # Returns
    ///
    /// The cluster URL as a string.
    pub fn get_current_context(&self) -> String {
        self.config.cluster_url.to_string()
    }

    /// Gets all available Kubernetes contexts from the kubeconfig.
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - Kubeconfig cannot be loaded
    /// - Kubeconfig is invalid
    ///
    /// # Note
    ///
    /// This is a simplified implementation that returns a default context.
    /// A full implementation would parse ~/.kube/config to extract all context names.
    pub async fn get_contexts() -> Result<Vec<String>, AppError> {
        let _config = Config::infer().await
            .map_err(|e| AppError::KubernetesError(format!("Failed to load kubeconfig: {}", e)))?;

        // TODO: Parse kubeconfig file to get actual context names
        // For now, return a placeholder
        Ok(vec!["default".to_string()])
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    #[ignore] // Requires a valid kubeconfig
    async fn test_client_creation() {
        let result = Client::new().await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    #[ignore] // Requires a valid kubeconfig and cluster
    async fn test_list_ingresses() {
        let client = Client::new().await.unwrap();
        let result = client.list_ingresses().await;
        assert!(result.is_ok());
    }

    #[test]
    fn test_get_current_context() {
        // This test would require a mock client
        // Skipping for now as it requires async setup
    }
}
