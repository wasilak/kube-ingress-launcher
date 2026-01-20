# React + TypeScript Frontend Best Practices

## Overview

This guide covers React 19 and TypeScript best practices for building the frontend of Tauri applications.

## Component Patterns

### Functional Components with TypeScript

Always use functional components with proper TypeScript types:

```typescript
// ✅ Good
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
}

export function SearchInput({ value, onChange, placeholder, loading }: SearchInputProps) {
  return (
    <TextInput
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      placeholder={placeholder}
      disabled={loading}
    />
  );
}

// ❌ Bad
export function SearchInput(props: any) {
  return <TextInput {...props} />;
}
```

### Component File Structure

```typescript
// Component.tsx
import { useState } from 'react';
import { Stack, Text } from '@mantine/core';

// 1. Type definitions
interface ComponentProps {
  data: DataType[];
  onSelect: (item: DataType) => void;
}

// 2. Component definition
export function Component({ data, onSelect }: ComponentProps) {
  // 3. Hooks
  const [selected, setSelected] = useState<DataType | null>(null);
  
  // 4. Event handlers
  const handleClick = (item: DataType) => {
    setSelected(item);
    onSelect(item);
  };
  
  // 5. Render
  return (
    <Stack>
      {data.map((item) => (
        <div key={item.id} onClick={() => handleClick(item)}>
          {item.name}
        </div>
      ))}
    </Stack>
  );
}
```

## Custom Hooks

### Hook Naming and Structure

Custom hooks must start with "use" and follow clear patterns:

```typescript
// ✅ Good - Purpose-driven hook
export function useIngresses() {
  const [ingresses, setIngresses] = useState<IngressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorInfo | null>(null);

  useEffect(() => {
    fetchIngresses();
  }, []);

  const fetchIngresses = async () => {
    try {
      setLoading(true);
      const result = await invoke<IngressResponse>('get_ingresses');
      setIngresses(result.ingresses);
      setError(result.error);
    } catch (err) {
      setError({ message: 'Failed to fetch', details: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return { ingresses, loading, error, refetch: fetchIngresses };
}

// ❌ Bad - Generic lifecycle hook
export function useEffect() {
  // Don't create generic hooks
}
```

### Hook Optimization with useCallback

Wrap returned functions with `useCallback`:

```typescript
export function useSearch(items: Item[]) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  // ✅ Memoize callback
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  return { searchTerm, filteredItems, handleSearch };
}
```

## State Management

### Local State with useState

```typescript
export function Component() {
  // ✅ Good - Typed state
  const [count, setCount] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  // ❌ Bad - Untyped state
  const [data, setData] = useState(null);
}
```

### Derived State with useMemo

```typescript
export function IngressList({ ingresses, searchTerm }: Props) {
  // ✅ Good - Memoized derived state
  const filteredIngresses = useMemo(() => {
    return ingresses.filter((ing) =>
      ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ingresses, searchTerm]);

  // ❌ Bad - Computed on every render
  const filteredIngresses = ingresses.filter((ing) =>
    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return <div>{/* render */}</div>;
}
```

## Tauri Integration

### Invoking Commands

```typescript
import { invoke } from '@tauri-apps/api/core';

// ✅ Good - Typed invoke with error handling
async function fetchData() {
  try {
    const result = await invoke<DataResponse>('get_data', {
      filter: 'search term',
    });
    return result;
  } catch (error) {
    console.error('Command failed:', error);
    throw error;
  }
}

// ❌ Bad - Untyped, no error handling
async function fetchData() {
  const result = await invoke('get_data');
  return result;
}
```

### Listening to Events

```typescript
import { listen } from '@tauri-apps/api/event';

export function useDataUpdates() {
  const [data, setData] = useState<Data[]>([]);

  useEffect(() => {
    // ✅ Good - Cleanup listener
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      unlisten = await listen<Data[]>('data-updated', (event) => {
        setData(event.payload);
      });
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  return data;
}
```

## TypeScript Best Practices

### Type Definitions

```typescript
// ✅ Good - Clear, specific types
export interface IngressData {
  id: string;
  name: string;
  namespace: string;
  hosts: string[];
  urls: string[];
  tls: boolean;
}

export interface ErrorInfo {
  message: string;
  details?: string;
  timestamp: string;
}

// ❌ Bad - Any types
export interface IngressData {
  id: any;
  name: any;
  data: any;
}
```

### Type Guards

```typescript
// ✅ Good - Type guard
function isErrorInfo(value: unknown): value is ErrorInfo {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as ErrorInfo).message === 'string'
  );
}

// Usage
if (isErrorInfo(data)) {
  console.log(data.message); // TypeScript knows data is ErrorInfo
}
```

### Generic Components

```typescript
// ✅ Good - Generic list component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <div>
      {items.map((item) => (
        <div key={keyExtractor(item)}>{renderItem(item)}</div>
      ))}
    </div>
  );
}

// Usage
<List
  items={ingresses}
  renderItem={(ing) => <IngressItem ingress={ing} />}
  keyExtractor={(ing) => ing.id}
/>
```

## Performance Optimization

### Memoization

```typescript
import { memo, useMemo, useCallback } from 'react';

// ✅ Good - Memoized component
export const IngressItem = memo(function IngressItem({ ingress, onSelect }: Props) {
  const handleClick = useCallback(() => {
    onSelect(ingress);
  }, [ingress, onSelect]);

  return <div onClick={handleClick}>{ingress.name}</div>;
});

// ✅ Good - Memoized computation
export function IngressList({ ingresses }: Props) {
  const sortedIngresses = useMemo(() => {
    return [...ingresses].sort((a, b) => a.name.localeCompare(b.name));
  }, [ingresses]);

  return <div>{/* render */}</div>;
}
```

### Debouncing

```typescript
import { useDebouncedValue } from '@mantine/hooks';

export function SearchInput({ onChange }: Props) {
  const [value, setValue] = useState('');
  const [debouncedValue] = useDebouncedValue(value, 150);

  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  return (
    <TextInput
      value={value}
      onChange={(e) => setValue(e.currentTarget.value)}
    />
  );
}
```

## Error Handling

### Error Boundaries

```typescript
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}
```

### Async Error Handling

```typescript
export function useAsyncOperation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (operation: () => Promise<void>) => {
    try {
      setLoading(true);
      setError(null);
      await operation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, execute };
}
```

## Testing

### Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  it('should call onChange when typing', () => {
    const onChange = jest.fn();
    render(<SearchInput value="" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(onChange).toHaveBeenCalledWith('test');
  });

  it('should display loading state', () => {
    render(<SearchInput value="" onChange={() => {}} loading={true} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
```

### Hook Testing

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
});
```

## UI Component Library (Mantine)

### Using Mantine Components

```typescript
import { Stack, Group, Text, Button, TextInput } from '@mantine/core';

export function Form() {
  return (
    <Stack gap="md">
      <TextInput
        label="Name"
        placeholder="Enter name"
        required
      />
      
      <Group justify="space-between">
        <Button variant="light">Cancel</Button>
        <Button>Submit</Button>
      </Group>
    </Stack>
  );
}
```

### Mantine Hooks

```typescript
import { useDisclosure, useDebouncedValue, useLocalStorage } from '@mantine/hooks';

export function Component() {
  // Modal state
  const [opened, { open, close }] = useDisclosure(false);
  
  // Debounced value
  const [value, setValue] = useState('');
  const [debounced] = useDebouncedValue(value, 200);
  
  // Local storage
  const [settings, setSettings] = useLocalStorage({
    key: 'app-settings',
    defaultValue: { theme: 'light' },
  });

  return <div>{/* render */}</div>;
}
```

## Best Practices Summary

1. **Type Everything**: Use TypeScript types for all props, state, and functions
2. **Custom Hooks**: Extract reusable logic into purpose-driven hooks
3. **Memoization**: Use useMemo and useCallback for performance
4. **Error Handling**: Always handle errors in async operations
5. **Component Structure**: Keep components focused and single-purpose
6. **Testing**: Write tests for components and hooks
7. **Tauri Integration**: Type all invoke calls and event listeners
8. **Performance**: Debounce inputs, memoize expensive computations

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Mantine UI](https://mantine.dev/)
- [Testing Library](https://testing-library.com/react)
