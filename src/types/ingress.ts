/**
 * TypeScript type definitions for Kubernetes Ingress Desktop Search
 * 
 * These types match the Kubernetes ingress structure and Rust backend data models.
 * They are used throughout the React frontend for type safety and IntelliSense.
 */

/**
 * Represents a Kubernetes ingress resource with extracted information
 * 
 * Requirements: 5.1, 15.1-15.10
 */
export interface IngressData {
  /** Unique identifier from Kubernetes metadata.uid */
  id: string;
  
  /** Ingress name from metadata.name */
  name: string;
  
  /** Namespace from metadata.namespace */
  namespace: string;
  
  /** List of hosts from spec.rules[].host and spec.tls[].hosts (deduplicated) */
  hosts: string[];
  
  /** List of paths from spec.rules[].http.paths[].path */
  paths: string[];
  
  /** Complete URLs constructed from protocol + host + path */
  urls: string[];
  
  /** User-defined annotations (auto-generated ones filtered out) */
  annotations: Record<string, string>;
  
  /** ISO 8601 timestamp from metadata.creationTimestamp */
  creationTimestamp: string;
  
  /** Whether the ingress has TLS configuration */
  tls: boolean;
  
  /** Status of the ingress resource */
  status: 'ready' | 'pending' | 'error' | 'unknown';
  
  /** Optional labels from metadata.labels */
  labels?: Record<string, string>;
}

/**
 * Error information for displaying errors to users
 * 
 * Requirements: 11.1-11.9
 */
export interface ErrorInfo {
  /** User-friendly error message */
  message: string;
  
  /** Optional detailed error information for debugging */
  details?: string;
  
  /** ISO 8601 timestamp when the error occurred */
  timestamp: string;
}

/**
 * Application settings configuration
 * 
 * Requirements: 9.1-9.20, 17.1-17.12
 */
export interface Settings {
  /** Global keyboard shortcut (e.g., "CmdOrCtrl+Shift+K") */
  globalShortcut: string;
  
  /** Background refresh interval in seconds (10-3600) */
  refreshIntervalSecs: number;
  
  /** Whether to start application on system login */
  autostart: boolean;
  
  /** Active Kubernetes context name */
  kubeContext: string;
  
  /** Theme mode: "light", "dark", or "system" */
  theme: string;
}

/**
 * Response from get_ingresses Tauri command
 * 
 * Requirements: 7.1-7.10
 */
export interface IngressResponse {
  /** List of ingress resources */
  ingresses: IngressData[];
  
  /** Error information if last refresh failed */
  error: ErrorInfo | null;
  
  /** ISO 8601 timestamp of last successful update */
  lastUpdated: string | null;
}

/**
 * Version information for the application
 * 
 * Contains version number, git branch (when running locally), and build info.
 */
export interface VersionInfo {
  /** Application version from Cargo.toml */
  version: string;
  
  /** Git branch (if available) */
  gitBranch: string | null;
  
  /** Git commit hash (if available) */
  gitCommit: string | null;
  
  /** Build profile (debug or release) */
  buildProfile: string;
}
