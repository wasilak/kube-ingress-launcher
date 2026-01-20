import { TextInput, Loader } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { useEffect } from 'react';

/**
 * Props for the SearchInput component
 * 
 * Requirements: 7.2, 7.4, 12.4
 */
interface SearchInputProps {
  /** Current search value */
  value: string;
  
  /** Callback when search value changes (debounced) */
  onChange: (value: string) => void;
  
  /** Optional loading state indicator */
  loading?: boolean;
}

/**
 * SearchInput component with auto-focus and debouncing
 * 
 * Features:
 * - Auto-focuses on mount for immediate typing
 * - Debounces input with 150ms delay to reduce filtering overhead
 * - Shows loading indicator when data is being fetched
 * - Uses Mantine TextInput with search icon
 * 
 * Requirements: 7.2, 7.4, 12.4
 */
export function SearchInput({ value, onChange, loading }: SearchInputProps) {
  // Debounce the search value with 150ms delay
  const [debouncedValue] = useDebouncedValue(value, 150);

  // Call onChange when debounced value changes
  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  return (
    <TextInput
      placeholder="Search ingresses..."
      leftSection={<IconSearch size={16} />}
      rightSection={loading ? <Loader size="xs" /> : null}
      autoFocus
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
    />
  );
}
