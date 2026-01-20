# Rust Best Practices

## Code Style

### Formatting
- Always run `cargo fmt` (handled automatically by `cargo build`)
- Use `cargo clippy` for linting
- Follow standard Rust formatting conventions

### Error Handling
- Always check errors, never ignore them
- Use `Result<T, E>` for recoverable errors
- Use `thiserror` crate for custom error types
- Wrap errors with context: `map_err(|e| AppError::KubernetesError(format!("failed to list ingresses: {}", e)))`
- Use `?` operator for error propagation
- Return errors, don't panic (except in truly exceptional cases)

```rust
// ✅ Good
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Kubernetes error: {0}")]
    KubernetesError(String),
    
    #[error("Settings error: {0}")]
    SettingsError(String),
}

pub async fn list_ingresses(&self) -> Result<Vec<Ingress>, AppError> {
    let ingresses: Api<Ingress> = Api::all(self.client.clone());
    
    let list = ingresses.list(&Default::default()).await
        .map_err(|e| AppError::KubernetesError(format!("Failed to list ingresses: {}", e)))?;

    Ok(list.items)
}

// ❌ Bad
pub async fn list_ingresses(&self) -> Vec<Ingress> {
    let ingresses: Api<Ingress> = Api::all(self.client.clone());
    ingresses.list(&Default::default()).await.unwrap() // Don't unwrap!
}
```

### Async/Await with Tokio
- Use `tokio` runtime for async operations
- Always use `async fn` for asynchronous functions
- Use `.await` for async operations
- Use `tokio::spawn` for background tasks
- Use `tokio::time::interval` for periodic tasks

```rust
// ✅ Good
use tokio::time::{interval, Duration};

pub async fn start_refresh_task(app_handle: AppHandle) {
    let mut interval = interval(Duration::from_secs(60));

    loop {
        interval.tick().await;
        
        if let Err(e) = fetch_and_update(&app_handle).await {
            eprintln!("Refresh failed: {}", e);
        }
    }
}

// ❌ Bad
pub fn start_refresh_task(app_handle: AppHandle) {
    loop {
        std::thread::sleep(Duration::from_secs(60)); // Blocking!
        fetch_and_update(&app_handle); // Not async!
    }
}
```

### State Management
- Use `Arc<RwLock<T>>` for shared mutable state
- Use `RwLock` for read-heavy workloads
- Use `Mutex` for write-heavy workloads
- Always use `.read()` or `.write()` appropriately

```rust
// ✅ Good
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone)]
pub struct AppState {
    pub ingresses: Arc<RwLock<Vec<IngressData>>>,
    pub last_error: Arc<RwLock<Option<ErrorInfo>>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            ingresses: Arc::new(RwLock::new(Vec::new())),
            last_error: Arc::new(RwLock::new(None)),
        }
    }
}

// Usage
async fn update_ingresses(state: &AppState, new_ingresses: Vec<IngressData>) {
    let mut ingresses = state.ingresses.write().await;
    *ingresses = new_ingresses;
}

// ❌ Bad
pub struct AppState {
    pub ingresses: Vec<IngressData>, // Not thread-safe!
}
```

## Tauri-Specific Patterns

### Command Handlers
- Use `#[tauri::command]` macro
- Return `Result<T, String>` for error handling
- Use `State<'_, T>` for accessing managed state
- Keep commands simple and focused

```rust
// ✅ Good
#[tauri::command]
pub async fn get_ingresses(state: State<'_, AppState>) -> Result<IngressResponse, String> {
    let ingresses = state.ingresses.read().await;
    let last_error = state.last_error.read().await;
    
    Ok(IngressResponse {
        ingresses: ingresses.clone(),
        error: last_error.clone(),
    })
}

// ❌ Bad
#[tauri::command]
pub async fn get_ingresses(state: State<'_, AppState>) -> IngressResponse {
    let ingresses = state.ingresses.read().await;
    IngressResponse {
        ingresses: ingresses.clone(),
        error: None, // No error handling!
    }
}
```

### State Registration
- Register state in `.setup()` hook
- Use `.manage()` to register state
- Clone state for background tasks

```rust
// ✅ Good
fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_state = AppState::new();
            app.manage(app_state.clone());
            
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                start_refresh_task(app_handle).await;
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_ingresses])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Project Structure

### Module Organization
```
src-tauri/src/
├── main.rs              # Entry point
├── commands/            # Tauri command handlers
│   ├── mod.rs
│   ├── ingresses.rs
│   ├── settings.rs
│   └── kubernetes.rs
├── k8s/                 # Kubernetes client
│   ├── mod.rs
│   ├── client.rs
│   └── transform.rs
├── state/               # Application state
│   ├── mod.rs
│   └── app_state.rs
├── refresh/             # Background tasks
│   ├── mod.rs
│   └── task.rs
├── settings/            # Settings management
│   ├── mod.rs
│   └── store.rs
└── error.rs             # Error types
```

### Module Naming
- Use singular nouns: `state`, not `states`
- Short, descriptive names
- Use underscores for multi-word names: `refresh_task`

## Serialization with Serde

### Derive Macros
- Use `#[derive(Serialize, Deserialize)]` for data types
- Use `#[derive(Clone)]` when needed for state
- Use `#[serde(rename_all = "camelCase")]` for JavaScript interop

```rust
// ✅ Good
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngressData {
    pub id: String,
    pub name: String,
    pub namespace: String,
    pub hosts: Vec<String>,
    pub creation_timestamp: String,
}
```

## Testing

### Unit Test Structure
- Use `#[cfg(test)]` module
- Test file naming: tests in same file or `tests/` directory
- Test function naming: `test_function_name`

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transform_ingress_basic() {
        let k8s_ingress = create_test_ingress("test", "default");
        let result = transform_ingress(&k8s_ingress);

        assert_eq!(result.name, "test");
        assert_eq!(result.namespace, "default");
    }
}
```

### Property-Based Tests
- Use `proptest` crate
- Test universal properties
- Run with minimum 100 iterations

```rust
#[cfg(test)]
mod proptests {
    use super::*;
    use proptest::prelude::*;

    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]

        #[test]
        fn test_transform_preserves_name(
            name in "[a-z]{1,20}",
        ) {
            let k8s_ingress = create_ingress_with_name(&name);
            let result = transform_ingress(&k8s_ingress);
            prop_assert_eq!(&result.name, &name);
        }
    }
}
```

## Dependencies

### Minimal Dependencies
- Prefer standard library when possible
- Carefully evaluate third-party dependencies
- Pin dependency versions in `Cargo.toml`

### Common Dependencies
```toml
[dependencies]
tauri = { version = "2.0", features = ["macos-private-api"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.0", features = ["full"] }
thiserror = "2.0"
```

## Documentation

### Module Documentation
```rust
//! This module implements Kubernetes client functionality.
//! It provides methods for connecting to clusters and fetching ingress resources.
```

### Function Documentation
```rust
/// Transforms a Kubernetes Ingress object into our internal IngressData format.
///
/// # Arguments
/// * `k8s_ingress` - The Kubernetes Ingress object to transform
///
/// # Returns
/// An `IngressData` struct with extracted information
pub fn transform_ingress(k8s_ingress: &Ingress) -> IngressData {
    // ...
}
```

### Exported Items
- All public items should have doc comments
- Start with the item being documented
- Use complete sentences

## Performance

### Avoid Premature Optimization
- Write clear code first
- Profile before optimizing
- Optimize hot paths only

### Memory Allocation
- Reuse buffers when possible
- Use `Vec::with_capacity` when size is known
- Avoid unnecessary clones

### Async Best Practices
- Don't block the async runtime
- Use `tokio::spawn` for CPU-intensive tasks
- Use `tokio::spawn_blocking` for blocking operations

## Common Pitfalls to Avoid

1. **Ignoring errors**: Always check and handle errors with `Result`
2. **Blocking in async**: Use `.await`, not blocking operations
3. **Unnecessary clones**: Use references when possible
4. **Panic in libraries**: Return errors instead of panicking
5. **Not using `?` operator**: Simplify error propagation
6. **Mutex deadlocks**: Keep lock scopes small
7. **Premature abstraction**: Write concrete code first, abstract later
