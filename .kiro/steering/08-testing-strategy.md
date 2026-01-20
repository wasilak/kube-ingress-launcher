# Testing Strategy for Rust and React

## Overview

This project uses a dual testing approach: **unit tests** for specific examples and edge cases, and **property-based tests** for universal correctness properties.

## Testing Philosophy

### Unit Tests
- Test specific examples
- Test edge cases
- Test error conditions
- Fast and focused
- Easy to understand

### Property-Based Tests
- Test universal properties
- Generate many test cases automatically
- Find edge cases you didn't think of
- Verify correctness across all inputs
- Run with minimum 100 iterations

## Rust Backend Testing

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transform_ingress_basic() {
        let k8s_ingress = create_test_ingress("test", "default", vec!["example.com"]);
        let result = transform_ingress(&k8s_ingress);

        assert_eq!(result.name, "test");
        assert_eq!(result.namespace, "default");
        assert_eq!(result.hosts, vec!["example.com"]);
    }

    #[test]
    fn test_filter_annotations() {
        let mut annotations = HashMap::new();
        annotations.insert("kubectl.kubernetes.io/last-applied".to_string(), "{}".to_string());
        annotations.insert("custom.annotation".to_string(), "value".to_string());

        let filtered = filter_annotations(annotations);

        assert!(!filtered.contains_key("kubectl.kubernetes.io/last-applied"));
        assert_eq!(filtered.get("custom.annotation"), Some(&"value".to_string()));
    }

    #[test]
    fn test_empty_ingress() {
        let k8s_ingress = create_empty_ingress();
        let result = transform_ingress(&k8s_ingress);

        assert!(result.hosts.is_empty());
        assert!(result.paths.is_empty());
        assert!(!result.tls);
    }
}
```

### Property-Based Tests with proptest

```rust
#[cfg(test)]
mod proptests {
    use super::*;
    use proptest::prelude::*;

    // Feature: kube-ingress-desktop, Property 1: Ingress Transformation Correctness
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]

        #[test]
        fn test_transform_preserves_name_and_namespace(
            name in "[a-z]{1,20}",
            namespace in "[a-z]{1,20}",
        ) {
            let k8s_ingress = create_ingress_with_metadata(&name, &namespace);
            let result = transform_ingress(&k8s_ingress);

            prop_assert_eq!(&result.name, &name);
            prop_assert_eq!(&result.namespace, &namespace);
        }

        #[test]
        fn test_transform_extracts_all_hosts(
            hosts in prop::collection::vec("[a-z]{1,10}\\.[a-z]{2,5}", 1..5)
        ) {
            let k8s_ingress = create_ingress_with_hosts(&hosts);
            let result = transform_ingress(&k8s_ingress);

            for host in &hosts {
                prop_assert!(result.hosts.contains(host));
            }
        }

        #[test]
        fn test_tls_detection(
            has_tls in prop::bool::ANY,
        ) {
            let k8s_ingress = if has_tls {
                create_ingress_with_tls()
            } else {
                create_ingress_without_tls()
            };
            
            let result = transform_ingress(&k8s_ingress);
            prop_assert_eq!(result.tls, has_tls);
        }
    }
}
```

### Async Tests with tokio-test

```rust
#[cfg(test)]
mod async_tests {
    use super::*;
    use tokio::test;

    #[tokio::test]
    async fn test_fetch_ingresses() {
        let client = K8sClient::new().await.unwrap();
        let result = client.list_ingresses().await;

        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_state_update() {
        let state = AppState::new();
        let ingresses = vec![create_test_ingress("test", "default")];

        {
            let mut state_ingresses = state.ingresses.write().await;
            *state_ingresses = ingresses.clone();
        }

        let read_ingresses = state.ingresses.read().await;
        assert_eq!(read_ingresses.len(), 1);
        assert_eq!(read_ingresses[0].name, "test");
    }
}
```

### Test Helpers

```rust
#[cfg(test)]
mod test_helpers {
    use super::*;

    pub fn create_test_ingress(name: &str, namespace: &str) -> Ingress {
        // Create test ingress object
        Ingress {
            metadata: ObjectMeta {
                name: Some(name.to_string()),
                namespace: Some(namespace.to_string()),
                ..Default::default()
            },
            spec: Some(IngressSpec {
                ..Default::default()
            }),
            ..Default::default()
        }
    }

    pub fn create_ingress_with_hosts(hosts: &[String]) -> Ingress {
        // Create ingress with specific hosts
        // Implementation
    }
}
```

## React Frontend Testing

### Component Tests with Testing Library

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IngressList } from './IngressList';

describe('IngressList', () => {
  it('should display all ingresses', () => {
    const ingresses = [
      createTestIngress('ing1', 'default', ['example.com']),
      createTestIngress('ing2', 'prod', ['api.example.com']),
    ];

    render(<IngressList ingresses={ingresses} onSelect={() => {}} />);

    expect(screen.getByText('ing1')).toBeInTheDocument();
    expect(screen.getByText('ing2')).toBeInTheDocument();
  });

  it('should show "No ingresses found" when list is empty', () => {
    render(<IngressList ingresses={[]} onSelect={() => {}} />);
    expect(screen.getByText('No ingresses found')).toBeInTheDocument();
  });

  it('should call onSelect when item is clicked', () => {
    const onSelect = jest.fn();
    const ingresses = [createTestIngress('test', 'default')];

    render(<IngressList ingresses={ingresses} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('test'));
    expect(onSelect).toHaveBeenCalledWith(ingresses[0]);
  });
});
```

### Hook Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useIngresses } from './useIngresses';

describe('useIngresses', () => {
  it('should fetch ingresses on mount', async () => {
    const { result } = renderHook(() => useIngresses());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.ingresses).toBeDefined();
  });

  it('should handle errors', async () => {
    // Mock invoke to throw error
    jest.mock('@tauri-apps/api/core', () => ({
      invoke: jest.fn().mockRejectedValue(new Error('Failed')),
    }));

    const { result } = renderHook(() => useIngresses());

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});
```

### Property-Based Tests with fast-check

```typescript
import fc from 'fast-check';
import { filterIngresses } from '../utils/search';

// Feature: kube-ingress-desktop, Property 2: Search Filtering Correctness
describe('Search Filtering', () => {
  it('should filter correctly for any search term', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 20 }),
          namespace: fc.string({ minLength: 1, maxLength: 20 }),
          hosts: fc.array(fc.domain()),
          urls: fc.array(fc.webUrl()),
          paths: fc.array(fc.string()),
          tls: fc.boolean(),
          annotations: fc.dictionary(fc.string(), fc.string()),
          creationTimestamp: fc.date().map(d => d.toISOString()),
          status: fc.constantFrom('ready', 'pending', 'error', 'unknown'),
        })),
        fc.string(),
        (ingresses, searchTerm) => {
          const filtered = filterIngresses(ingresses, searchTerm);
          const term = searchTerm.toLowerCase();

          // All filtered ingresses should match
          for (const ing of filtered) {
            const matches =
              ing.name.toLowerCase().includes(term) ||
              ing.namespace.toLowerCase().includes(term) ||
              ing.hosts.some(h => h.toLowerCase().includes(term)) ||
              ing.urls.some(u => u.toLowerCase().includes(term));
            expect(matches).toBe(true);
          }

          // No non-matching ingresses should be included
          for (const ing of ingresses) {
            const matches =
              ing.name.toLowerCase().includes(term) ||
              ing.namespace.toLowerCase().includes(term) ||
              ing.hosts.some(h => h.toLowerCase().includes(term)) ||
              ing.urls.some(u => u.toLowerCase().includes(term));
            
            if (matches) {
              expect(filtered).toContainEqual(ing);
            } else {
              expect(filtered).not.toContainEqual(ing);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Utilities

```typescript
// test-utils.ts
export function createTestIngress(
  name: string,
  namespace: string,
  hosts: string[] = []
): IngressData {
  return {
    id: `${namespace}-${name}`,
    name,
    namespace,
    hosts,
    paths: ['/'],
    urls: hosts.map(h => `https://${h}/`),
    annotations: {},
    creationTimestamp: new Date().toISOString(),
    tls: true,
    status: 'ready',
  };
}

export function mockInvoke<T>(response: T) {
  return jest.fn().mockResolvedValue(response);
}
```

## Integration Testing

### Tauri Command Integration Tests

```rust
#[cfg(test)]
mod integration_tests {
    use super::*;
    use tauri::test::{mock_builder, MockRuntime};

    #[tokio::test]
    async fn test_get_ingresses_command() {
        let app = mock_builder().build(tauri::generate_context!()).unwrap();
        let state = AppState::new();
        
        // Populate state
        {
            let mut ingresses = state.ingresses.write().await;
            ingresses.push(create_test_ingress("test", "default"));
        }
        
        app.manage(state);
        
        // Test command
        let result = get_ingresses(app.state()).await;
        assert!(result.is_ok());
        
        let response = result.unwrap();
        assert_eq!(response.ingresses.len(), 1);
    }
}
```

### End-to-End Testing

```typescript
// e2e/app.test.ts
import { test, expect } from '@playwright/test';

test('should display ingresses', async ({ page }) => {
  await page.goto('/');
  
  // Wait for data to load
  await page.waitForSelector('[data-testid="ingress-list"]');
  
  // Check ingresses are displayed
  const items = await page.locator('[data-testid="ingress-item"]').count();
  expect(items).toBeGreaterThan(0);
});

test('should filter ingresses', async ({ page }) => {
  await page.goto('/');
  
  // Type in search
  await page.fill('[data-testid="search-input"]', 'test');
  
  // Check filtered results
  await page.waitForTimeout(200); // Wait for debounce
  const items = await page.locator('[data-testid="ingress-item"]').count();
  expect(items).toBeGreaterThan(0);
});
```

## Test Configuration

### Rust (Cargo.toml)

```toml
[dev-dependencies]
proptest = "1.0"
tokio-test = "0.4"

[[test]]
name = "integration"
path = "tests/integration_test.rs"
```

### TypeScript (package.json)

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jest": "^30.0.0",
    "jest-environment-jsdom": "^30.0.0",
    "fast-check": "^3.0.0"
  }
}
```

### Jest Configuration (jest.config.js)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
  ],
};
```

## Running Tests

### Rust Tests

```bash
# Run all tests
cargo test

# Run specific test
cargo test test_transform_ingress

# Run with output
cargo test -- --nocapture

# Run property tests only
cargo test proptests

# Run with coverage
cargo tarpaulin
```

### TypeScript Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- SearchInput.test.tsx
```

## Test Coverage Goals

- **Rust Backend**: Minimum 70% code coverage
- **React Frontend**: Minimum 70% code coverage
- **Property Tests**: Minimum 100 iterations per property
- **Integration Tests**: Cover all Tauri commands
- **E2E Tests**: Cover critical user flows

## Best Practices

1. **Test Behavior, Not Implementation**: Test what the code does, not how it does it
2. **Arrange-Act-Assert**: Structure tests clearly
3. **One Assertion Per Test**: Keep tests focused
4. **Use Descriptive Names**: Test names should describe what they test
5. **Test Edge Cases**: Empty inputs, null values, boundary conditions
6. **Mock External Dependencies**: Don't rely on external services in tests
7. **Run Tests in CI/CD**: Automate test execution
8. **Property Tests for Core Logic**: Use property-based tests for critical algorithms

## Resources

- [Rust Testing](https://doc.rust-lang.org/book/ch11-00-testing.html)
- [proptest Documentation](https://docs.rs/proptest/)
- [Testing Library](https://testing-library.com/)
- [fast-check Documentation](https://fast-check.dev/)
