# Naming Conventions and Brand Agnosticism

## Brand-Agnostic Code

Whatever project name we settle on, code MUST be written in a way that is **name-agnostic**. The codebase should follow this principle.

### ✅ Allowed Uses of Project Name

- **Documentation**: README, specs, comments, user-facing docs
- **Package name**: `package kube_ingress_desktop` (Rust crate name)
- **Binary name**: Application executable name
- **Repository name**: GitHub repo name
- **User-facing messages**: CLI help text, startup messages, log messages, window titles

### ❌ NOT Allowed in Code

- **Function names**: ❌ `fn kube_ingress_start()` → ✅ `fn start()`
- **Struct names**: ❌ `struct KubeIngressServer` → ✅ `struct Server`
- **Variable names**: ❌ `kube_ingress_config` → ✅ `config`
- **Interface names**: ❌ `trait KubeIngressProvider` → ✅ `trait Provider`
- **Method names**: ❌ `init_kube_ingress()` → ✅ `init()`
- **Constants**: ❌ `KUBE_INGRESS_VERSION` → ✅ `VERSION`
- **Component names**: ❌ `<KubeIngressList />` → ✅ `<IngressList />`

## Rust Naming Conventions

Follow standard Rust naming conventions:

### Module Names
- Short, lowercase, single word or snake_case
- No hyphens in module names (use underscores)
- Examples: `state`, `commands`, `k8s`, `refresh_task`

### Struct and Enum Names
- Use PascalCase (UpperCamelCase)
- Examples: `AppState`, `IngressData`, `ErrorInfo`, `K8sClient`

### Function and Method Names
- Use snake_case
- Examples: `get_ingresses`, `transform_ingress`, `start_refresh_task`

### Constants
- Use SCREAMING_SNAKE_CASE
- Examples: `DEFAULT_REFRESH_INTERVAL`, `MAX_INGRESSES_DISPLAYED`

### Trait Names
- Use PascalCase
- Single-method traits: verb + "er" suffix when appropriate
- Examples: `Provider`, `Transformer`, `Validator`

### Avoid Stuttering
- ❌ `state::StateManager` → ✅ `state::Manager`
- ❌ `commands::CommandHandler` → ✅ `commands::Handler`
- ❌ `k8s::K8sClient` → ✅ `k8s::Client`

## TypeScript/React Naming Conventions

### Component Names
- Use PascalCase
- Examples: `SearchInput`, `IngressList`, `IngressItem`, `ErrorBanner`

### Hook Names
- Start with "use" prefix
- Use camelCase
- Examples: `useIngresses`, `useSearch`, `useSettings`

### Function Names
- Use camelCase
- Examples: `handleClick`, `fetchIngresses`, `filterResults`

### Interface/Type Names
- Use PascalCase
- Examples: `IngressData`, `ErrorInfo`, `Settings`

### File Names
- Components: PascalCase matching component name
- Hooks: camelCase matching hook name
- Utilities: camelCase
- Examples: `SearchInput.tsx`, `useIngresses.ts`, `filterUtils.ts`

## Examples

### ✅ Good - Brand Agnostic Rust

```rust
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

pub async fn start_refresh_task(app_handle: AppHandle) {
    // Implementation
}
```

### ❌ Bad - Brand Specific Rust

```rust
pub struct KubeIngressAppState {
    pub kube_ingress_data: Arc<RwLock<Vec<KubeIngressData>>>,
}

pub async fn start_kube_ingress_refresh(app_handle: AppHandle) {
    // Implementation
}
```

### ✅ Good - Brand Agnostic React

```typescript
export function IngressList({ ingresses, onSelect }: IngressListProps) {
  return (
    <Stack gap="xs">
      {ingresses.map((ingress) => (
        <IngressItem key={ingress.id} ingress={ingress} onSelect={onSelect} />
      ))}
    </Stack>
  );
}

export function useIngresses() {
  const [ingresses, setIngresses] = useState<IngressData[]>([]);
  // Implementation
  return { ingresses, loading, error };
}
```

### ❌ Bad - Brand Specific React

```typescript
export function KubeIngressDesktopList({ ingresses }: Props) {
  // Implementation
}

export function useKubeIngressDesktopData() {
  // Implementation
}
```

## Why This Matters

1. **Reusability**: Code can be forked/reused without renaming everything
2. **Clarity**: Shorter names are easier to read and understand
3. **Idioms**: Follows standard Rust and TypeScript conventions
4. **Maintainability**: Less coupling to brand name
5. **Professionalism**: Shows understanding of proper design
6. **Community**: Makes the project more approachable for contributors

## Documentation is Different

In documentation, user-facing messages, and comments, using the project name is fine:

```rust
// AppState manages the kube-ingress-desktop application state
pub struct AppState {
    // ...
}

fn main() {
    println!("Kube Ingress Desktop - Kubernetes Ingress Search");
    // ...
}
```

```typescript
/**
 * IngressList component for kube-ingress-desktop
 * Displays a list of Kubernetes ingress resources
 */
export function IngressList(props: IngressListProps) {
    // ...
}
```

The key is: **code structure and naming should be generic, documentation can be branded**.
