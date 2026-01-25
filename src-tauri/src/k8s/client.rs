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
    /// Validates that the kubeconfig file exists and has a valid current-context.
    ///
    /// This function checks:
    /// - The kubeconfig file exists at the expected location
    /// - The kubeconfig file is readable
    /// - The kubeconfig has a valid current-context set
    ///
    /// # Returns
    ///
    /// Returns `Ok(())` if validation passes, or an error with a helpful message if validation fails.
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - Kubeconfig file does not exist
    /// - Kubeconfig file is not readable
    /// - Kubeconfig does not have a current-context set
    pub async fn validate_kubeconfig() -> Result<(), AppError> {
        use std::path::Path;
        
        // Determine kubeconfig path
        let kubeconfig_path = std::env::var("KUBECONFIG")
            .unwrap_or_else(|_| {
                let home = std::env::var("HOME").unwrap_or_else(|_| "~".to_string());
                format!("{}/.kube/config", home)
            });
        
        eprintln!("Validating kubeconfig at: {}", kubeconfig_path);
        
        // Check if file exists
        if !Path::new(&kubeconfig_path).exists() {
            let error_msg = format!(
                "Kubeconfig file not found at {}. Please ensure your kubeconfig file exists. You can create one by running 'kubectl config view' or setting up cluster access.",
                kubeconfig_path
            );
            eprintln!("{}", error_msg);
            return Err(AppError::KubernetesError(error_msg));
        }
        
        // Check if file is readable
        if let Err(e) = std::fs::metadata(&kubeconfig_path) {
            let error_msg = format!(
                "Kubeconfig file at {} exists but is not readable: {}. Please check file permissions.",
                kubeconfig_path, e
            );
            eprintln!("{}", error_msg);
            return Err(AppError::KubernetesError(error_msg));
        }
        
        // Try to load the config to validate it has a current-context
        match Config::infer().await {
            Ok(config) => {
                eprintln!("Kubeconfig validation successful. Current cluster: {}", config.cluster_url);
                Ok(())
            }
            Err(e) => {
                let error_msg = format!(
                    "Kubeconfig file at {} is invalid or missing current-context: {}. Please ensure your kubeconfig has a valid current-context set. You can check with 'kubectl config current-context'.",
                    kubeconfig_path, e
                );
                eprintln!("{}", error_msg);
                Err(AppError::KubernetesError(error_msg))
            }
        }
    }

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
        // Log the kubeconfig path being used for debugging
        let kubeconfig_path = std::env::var("KUBECONFIG")
            .unwrap_or_else(|_| {
                let home = std::env::var("HOME").unwrap_or_else(|_| "~".to_string());
                format!("{}/.kube/config", home)
            });
        
        eprintln!("Loading kubeconfig from: {}", kubeconfig_path);
        
        let config = Config::infer().await
            .map_err(|e| {
                let error_msg = format!(
                    "Failed to load kubeconfig from {}: {}. Please ensure your kubeconfig file exists and is valid.",
                    kubeconfig_path, e
                );
                eprintln!("{}", error_msg);
                AppError::KubernetesError(error_msg)
            })?;
        
        eprintln!("Successfully loaded kubeconfig. Cluster URL: {}", config.cluster_url);
        
        let client = KubeClient::try_from(config.clone())
            .map_err(|e| {
                let error_msg = format!(
                    "Failed to create Kubernetes client: {}. This may indicate authentication issues or invalid cluster configuration.",
                    e
                );
                eprintln!("{}", error_msg);
                AppError::KubernetesError(error_msg)
            })?;

        eprintln!("Kubernetes client created successfully");
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
            .map_err(|e| {
                // Check for authentication errors (401 Unauthorized)
                let error_string = e.to_string();
                if error_string.contains("401") || error_string.contains("Unauthorized") {
                    let error_msg = format!(
                        "Authentication failed (401 Unauthorized): {}. Please check your kubeconfig credentials and ensure you have valid authentication tokens.",
                        e
                    );
                    eprintln!("{}", error_msg);
                    AppError::KubernetesError(error_msg)
                } else if error_string.contains("403") || error_string.contains("Forbidden") {
                    let error_msg = format!(
                        "Access forbidden (403): {}. Your credentials are valid but you don't have permission to list ingresses.",
                        e
                    );
                    eprintln!("{}", error_msg);
                    AppError::KubernetesError(error_msg)
                } else if error_string.contains("connection") || error_string.contains("timeout") {
                    let error_msg = format!(
                        "Network connectivity issue: {}. Please check your cluster connectivity and ensure the cluster is reachable.",
                        e
                    );
                    eprintln!("{}", error_msg);
                    AppError::KubernetesError(error_msg)
                } else {
                    let error_msg = format!("Failed to list ingresses: {}", e);
                    eprintln!("{}", error_msg);
                    AppError::KubernetesError(error_msg)
                }
            })?;

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
    pub async fn get_contexts() -> Result<Vec<String>, AppError> {
        use kube::config::Kubeconfig;
        
        // Load kubeconfig from default location
        let kubeconfig = Kubeconfig::read()
            .map_err(|e| AppError::KubernetesError(format!("Failed to read kubeconfig: {}", e)))?;
        
        // Extract context names
        let context_names: Vec<String> = kubeconfig
            .contexts
            .iter()
            .map(|ctx| ctx.name.clone())
            .collect();
        
        if context_names.is_empty() {
            return Err(AppError::KubernetesError(
                "No contexts found in kubeconfig".to_string()
            ));
        }
        
        tracing::debug!("Found {} contexts in kubeconfig", context_names.len());
        Ok(context_names)
    }

    /// Switches to a different Kubernetes context.
    ///
    /// # Arguments
    ///
    /// * `context` - The name of the context to switch to
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - The context does not exist
    /// - Kubeconfig cannot be updated
    pub async fn switch_context(context: &str) -> Result<(), AppError> {
        use kube::config::Kubeconfig;
        use std::path::PathBuf;
        
        if context.is_empty() {
            return Err(AppError::KubernetesError("Context name cannot be empty".to_string()));
        }
        
        // Determine kubeconfig path
        let kubeconfig_path = std::env::var("KUBECONFIG")
            .map(PathBuf::from)
            .unwrap_or_else(|_| {
                let home = std::env::var("HOME").unwrap_or_else(|_| "~".to_string());
                PathBuf::from(format!("{}/.kube/config", home))
            });
        
        // Load kubeconfig
        let mut kubeconfig = Kubeconfig::read()
            .map_err(|e| AppError::KubernetesError(format!("Failed to read kubeconfig: {}", e)))?;
        
        // Verify the context exists
        let context_exists = kubeconfig
            .contexts
            .iter()
            .any(|ctx| ctx.name == context);
        
        if !context_exists {
            return Err(AppError::KubernetesError(
                format!("Context '{}' not found in kubeconfig", context)
            ));
        }
        
        // Update current-context
        kubeconfig.current_context = Some(context.to_string());
        
        // Write back to disk using serde_yaml
        let yaml_content = serde_yaml::to_string(&kubeconfig)
            .map_err(|e| AppError::KubernetesError(format!("Failed to serialize kubeconfig: {}", e)))?;
        
        std::fs::write(&kubeconfig_path, yaml_content)
            .map_err(|e| AppError::KubernetesError(format!("Failed to write kubeconfig: {}", e)))?;
        
        tracing::info!("Switched to context: {}", context);
        Ok(())
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
