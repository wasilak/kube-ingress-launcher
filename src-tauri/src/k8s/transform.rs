//! Ingress transformation utilities.
//!
//! This module provides functions to transform Kubernetes Ingress resources
//! into our internal IngressData format, extracting relevant information
//! and filtering auto-generated annotations.

use k8s_openapi::api::networking::v1::Ingress;
use crate::state::IngressData;
use std::collections::{HashMap, HashSet, BTreeMap};

/// Transforms a Kubernetes Ingress object into our internal IngressData format.
///
/// This function extracts:
/// - Name, namespace, and UID from metadata
/// - Hosts from spec.rules[].host and spec.tls[].hosts (deduplicated)
/// - Paths from spec.rules[].http.paths[].path
/// - Complete URLs constructed from protocol (https if TLS, http otherwise) + host + path
/// - User-defined annotations (filters out auto-generated ones)
/// - TLS status based on spec.tls presence
///
/// # Arguments
///
/// * `k8s_ingress` - The Kubernetes Ingress object to transform
///
/// # Returns
///
/// An `IngressData` struct with all extracted information
///
/// # Requirements
///
/// Implements requirements 5.1-5.8, 13.8
pub fn transform_ingress(k8s_ingress: &Ingress) -> IngressData {
    let metadata = &k8s_ingress.metadata;
    let spec = k8s_ingress.spec.as_ref();

    // Extract name, namespace, and id from metadata (Requirement 5.1, 5.2)
    let name = metadata.name.clone().unwrap_or_else(|| "unknown".to_string());
    let namespace = metadata.namespace.clone().unwrap_or_else(|| "default".to_string());
    let id = metadata.uid.clone().unwrap_or_else(|| format!("{}-{}", namespace, name));

    let mut hosts = HashSet::new();
    let mut paths = Vec::new();
    let mut urls = Vec::new();

    // Determine if TLS is configured (Requirement 5.8)
    let has_tls = spec
        .and_then(|s| s.tls.as_ref())
        .map(|tls_configs| !tls_configs.is_empty())
        .unwrap_or(false);

    if let Some(spec) = spec {
        // Extract hosts and paths from rules (Requirement 5.3, 5.4)
        if let Some(rules) = &spec.rules {
            for rule in rules {
                if let Some(host) = &rule.host {
                    hosts.insert(host.clone());

                    if let Some(http) = &rule.http {
                        for path in &http.paths {
                            let path_str = path.path.clone().unwrap_or_else(|| "/".to_string());
                            
                            // Only add unique paths
                            if !paths.contains(&path_str) {
                                paths.push(path_str.clone());
                            }

                            // Construct URL (Requirement 5.5)
                            let protocol = if has_tls { "https" } else { "http" };
                            let url = format!("{}://{}{}", protocol, host, path_str);
                            urls.push(url);
                        }
                    }
                }
            }
        }

        // Extract additional hosts from TLS configuration (Requirement 5.3)
        if let Some(tls_configs) = &spec.tls {
            for tls in tls_configs {
                if let Some(tls_hosts) = &tls.hosts {
                    for host in tls_hosts {
                        hosts.insert(host.clone());
                    }
                }
            }
        }
    }

    // Convert hosts HashSet to sorted Vec for consistent ordering
    let mut hosts_vec: Vec<String> = hosts.into_iter().collect();
    hosts_vec.sort();

    // Filter annotations (Requirement 5.6, 5.7)
    let annotations = filter_annotations(
        metadata.annotations.clone().unwrap_or_default()
    );

    // Extract labels (Requirement 5.7)
    let labels = metadata.labels.clone().map(|btree| {
        btree.into_iter().collect::<HashMap<String, String>>()
    });

    // Extract creation timestamp (Requirement 5.1)
    let creation_timestamp = metadata.creation_timestamp
        .as_ref()
        .map(|ts| ts.0.to_string())
        .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());

    IngressData {
        id,
        name,
        namespace,
        hosts: hosts_vec,
        paths,
        urls,
        annotations,
        creation_timestamp,
        tls: has_tls,
        status: "unknown".to_string(), // Requirement 5.8
        labels,
    }
}

/// Splits an ingress into multiple entries, one per host.
///
/// This function takes an ingress with multiple hosts and creates separate
/// IngressData entries for each host, with only the URLs relevant to that host.
///
/// # Arguments
///
/// * `ingress` - The IngressData to split by host
///
/// # Returns
///
/// A vector of IngressData, one for each host in the original ingress
pub fn split_ingress_by_host(ingress: &IngressData) -> Vec<IngressData> {
    if ingress.hosts.is_empty() {
        // If no hosts, return the original ingress as-is
        return vec![ingress.clone()];
    }

    if ingress.hosts.len() == 1 {
        // If only one host, return the original ingress as-is
        return vec![ingress.clone()];
    }

    // Create one entry per host
    ingress.hosts.iter().map(|host| {
        // Filter URLs to only include those for this host
        let host_urls: Vec<String> = ingress.urls.iter()
            .filter(|url| url.contains(host))
            .cloned()
            .collect();

        IngressData {
            id: format!("{}-{}", ingress.id, host),
            name: ingress.name.clone(),
            namespace: ingress.namespace.clone(),
            hosts: vec![host.clone()],
            paths: ingress.paths.clone(),
            urls: host_urls,
            annotations: ingress.annotations.clone(),
            creation_timestamp: ingress.creation_timestamp.clone(),
            tls: ingress.tls,
            status: ingress.status.clone(),
            labels: ingress.labels.clone(),
        }
    }).collect()
}

/// Filters out auto-generated annotations from Kubernetes.
///
/// Removes annotations with the following prefixes:
/// - kubectl.kubernetes.io/*
/// - deployment.kubernetes.io/*
/// - helm.sh/*
/// - meta.helm.sh/*
///
/// # Arguments
///
/// * `annotations` - BTreeMap of all annotations from Kubernetes
///
/// # Returns
///
/// HashMap containing only user-defined annotations
///
/// # Requirements
///
/// Implements requirement 5.6
fn filter_annotations(annotations: BTreeMap<String, String>) -> HashMap<String, String> {
    annotations
        .into_iter()
        .filter(|(key, _)| {
            !key.starts_with("kubectl.kubernetes.io/")
                && !key.starts_with("deployment.kubernetes.io/")
                && !key.starts_with("helm.sh/")
                && !key.starts_with("meta.helm.sh/")
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use k8s_openapi::api::networking::v1::{IngressSpec, IngressRule, HTTPIngressRuleValue, HTTPIngressPath, IngressBackend, IngressServiceBackend, ServiceBackendPort, IngressTLS};
    use k8s_openapi::apimachinery::pkg::apis::meta::v1::ObjectMeta;
    use k8s_openapi::jiff::Timestamp;
    use std::collections::BTreeMap;

    fn create_test_ingress(name: &str, namespace: &str, hosts: Vec<&str>) -> Ingress {
        let mut rules = Vec::new();
        
        for host in &hosts {
            rules.push(IngressRule {
                host: Some(host.to_string()),
                http: Some(HTTPIngressRuleValue {
                    paths: vec![HTTPIngressPath {
                        path: Some("/".to_string()),
                        path_type: "Prefix".to_string(),
                        backend: IngressBackend {
                            service: Some(IngressServiceBackend {
                                name: "test-service".to_string(),
                                port: Some(ServiceBackendPort {
                                    number: Some(80),
                                    ..Default::default()
                                }),
                            }),
                            ..Default::default()
                        },
                    }],
                }),
            });
        }

        Ingress {
            metadata: ObjectMeta {
                name: Some(name.to_string()),
                namespace: Some(namespace.to_string()),
                uid: Some(format!("uid-{}", name)),
                creation_timestamp: Some(k8s_openapi::apimachinery::pkg::apis::meta::v1::Time(Timestamp::now())),
                ..Default::default()
            },
            spec: Some(IngressSpec {
                rules: Some(rules),
                ..Default::default()
            }),
            ..Default::default()
        }
    }

    #[test]
    fn test_transform_ingress_basic() {
        let k8s_ingress = create_test_ingress("test-ingress", "default", vec!["example.com"]);
        let result = transform_ingress(&k8s_ingress);

        assert_eq!(result.name, "test-ingress");
        assert_eq!(result.namespace, "default");
        assert_eq!(result.id, "uid-test-ingress");
        assert_eq!(result.hosts, vec!["example.com"]);
        assert_eq!(result.paths, vec!["/"]);
        assert_eq!(result.urls, vec!["http://example.com/"]);
        assert!(!result.tls);
        assert_eq!(result.status, "unknown");
    }

    #[test]
    fn test_transform_ingress_multiple_hosts() {
        let k8s_ingress = create_test_ingress(
            "multi-host",
            "production",
            vec!["api.example.com", "www.example.com"]
        );
        let result = transform_ingress(&k8s_ingress);

        assert_eq!(result.name, "multi-host");
        assert_eq!(result.namespace, "production");
        assert_eq!(result.hosts.len(), 2);
        assert!(result.hosts.contains(&"api.example.com".to_string()));
        assert!(result.hosts.contains(&"www.example.com".to_string()));
        assert_eq!(result.urls.len(), 2);
    }

    #[test]
    fn test_transform_ingress_with_tls() {
        let mut k8s_ingress = create_test_ingress("tls-ingress", "default", vec!["secure.example.com"]);
        
        if let Some(spec) = k8s_ingress.spec.as_mut() {
            spec.tls = Some(vec![IngressTLS {
                hosts: Some(vec!["secure.example.com".to_string()]),
                secret_name: Some("tls-secret".to_string()),
            }]);
        }

        let result = transform_ingress(&k8s_ingress);

        assert!(result.tls);
        assert_eq!(result.urls, vec!["https://secure.example.com/"]);
    }

    #[test]
    fn test_transform_ingress_multiple_paths() {
        let mut k8s_ingress = create_test_ingress("multi-path", "default", vec!["example.com"]);
        
        if let Some(spec) = k8s_ingress.spec.as_mut() {
            if let Some(rules) = spec.rules.as_mut() {
                if let Some(rule) = rules.first_mut() {
                    if let Some(http) = rule.http.as_mut() {
                        http.paths.push(HTTPIngressPath {
                            path: Some("/api".to_string()),
                            path_type: "Prefix".to_string(),
                            backend: IngressBackend {
                                service: Some(IngressServiceBackend {
                                    name: "api-service".to_string(),
                                    port: Some(ServiceBackendPort {
                                        number: Some(8080),
                                        ..Default::default()
                                    }),
                                }),
                                ..Default::default()
                            },
                        });
                    }
                }
            }
        }

        let result = transform_ingress(&k8s_ingress);

        assert_eq!(result.paths.len(), 2);
        assert!(result.paths.contains(&"/".to_string()));
        assert!(result.paths.contains(&"/api".to_string()));
        assert_eq!(result.urls.len(), 2);
        assert!(result.urls.contains(&"http://example.com/".to_string()));
        assert!(result.urls.contains(&"http://example.com/api".to_string()));
    }

    #[test]
    fn test_transform_ingress_empty() {
        let k8s_ingress = Ingress {
            metadata: ObjectMeta {
                name: Some("empty-ingress".to_string()),
                namespace: Some("default".to_string()),
                uid: Some("uid-empty".to_string()),
                ..Default::default()
            },
            spec: Some(IngressSpec {
                ..Default::default()
            }),
            ..Default::default()
        };

        let result = transform_ingress(&k8s_ingress);

        assert_eq!(result.name, "empty-ingress");
        assert_eq!(result.namespace, "default");
        assert!(result.hosts.is_empty());
        assert!(result.paths.is_empty());
        assert!(result.urls.is_empty());
        assert!(!result.tls);
    }

    #[test]
    fn test_filter_annotations() {
        let mut annotations = BTreeMap::new();
        annotations.insert("kubectl.kubernetes.io/last-applied-configuration".to_string(), "{}".to_string());
        annotations.insert("deployment.kubernetes.io/revision".to_string(), "1".to_string());
        annotations.insert("helm.sh/chart".to_string(), "mychart-1.0.0".to_string());
        annotations.insert("meta.helm.sh/release-name".to_string(), "myrelease".to_string());
        annotations.insert("custom.annotation/key".to_string(), "value".to_string());
        annotations.insert("nginx.ingress.kubernetes.io/rewrite-target".to_string(), "/".to_string());

        let filtered = filter_annotations(annotations);

        assert_eq!(filtered.len(), 2);
        assert!(!filtered.contains_key("kubectl.kubernetes.io/last-applied-configuration"));
        assert!(!filtered.contains_key("deployment.kubernetes.io/revision"));
        assert!(!filtered.contains_key("helm.sh/chart"));
        assert!(!filtered.contains_key("meta.helm.sh/release-name"));
        assert_eq!(filtered.get("custom.annotation/key"), Some(&"value".to_string()));
        assert_eq!(filtered.get("nginx.ingress.kubernetes.io/rewrite-target"), Some(&"/".to_string()));
    }

    #[test]
    fn test_transform_ingress_with_labels() {
        let mut k8s_ingress = create_test_ingress("labeled-ingress", "default", vec!["example.com"]);
        
        let mut labels = BTreeMap::new();
        labels.insert("app".to_string(), "myapp".to_string());
        labels.insert("environment".to_string(), "production".to_string());
        k8s_ingress.metadata.labels = Some(labels);

        let result = transform_ingress(&k8s_ingress);

        assert!(result.labels.is_some());
        let labels = result.labels.unwrap();
        assert_eq!(labels.get("app"), Some(&"myapp".to_string()));
        assert_eq!(labels.get("environment"), Some(&"production".to_string()));
    }

    #[test]
    fn test_transform_ingress_tls_additional_hosts() {
        let mut k8s_ingress = create_test_ingress("tls-multi", "default", vec!["example.com"]);
        
        if let Some(spec) = k8s_ingress.spec.as_mut() {
            spec.tls = Some(vec![IngressTLS {
                hosts: Some(vec![
                    "example.com".to_string(),
                    "www.example.com".to_string(),
                    "api.example.com".to_string(),
                ]),
                secret_name: Some("tls-secret".to_string()),
            }]);
        }

        let result = transform_ingress(&k8s_ingress);

        assert!(result.tls);
        assert_eq!(result.hosts.len(), 3);
        assert!(result.hosts.contains(&"example.com".to_string()));
        assert!(result.hosts.contains(&"www.example.com".to_string()));
        assert!(result.hosts.contains(&"api.example.com".to_string()));
    }

    #[test]
    fn test_transform_ingress_no_metadata() {
        let k8s_ingress = Ingress {
            metadata: ObjectMeta::default(),
            spec: None,
            ..Default::default()
        };

        let result = transform_ingress(&k8s_ingress);

        assert_eq!(result.name, "unknown");
        assert_eq!(result.namespace, "default");
        assert!(result.id.starts_with("default-unknown"));
    }
}
