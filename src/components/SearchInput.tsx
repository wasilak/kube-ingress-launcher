import { TextInput, Loader, ActionIcon } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import { useEffect, useRef } from 'react';

/**
 * Props for the SearchInput component
 * 
 * Requirements: 7.2, 7.4, 12.4
 */
interface SearchInputProps {
  /** Current search value */
  value: string;
  
  /** Callback when search value changes */
  onChange: (value: string) => void;
  
  /** Optional loading state indicator */
  loading?: boolean;
}

/**
 * SearchInput component with auto-focus and clear button
 * 
 * Features:
 * - Auto-focuses on mount for immediate typing
 * - Auto-selects text when input gains focus (on window show)
 * - Shows loading indicator when data is being fetched
 * - Clear button (X) to reset search when text is present
 * - Uses Mantine TextInput with search icon
 * 
 * Requirements: 7.2, 7.4, 12.4, 18.1
 */
export function SearchInput({ value, onChange, loading }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-select text when input gains focus (happens when window is shown)
  useEffect(() => {
    const handleInputFocus = () => {
      // Only select if there's text and the selection isn't already active
      if (inputRef.current && value && inputRef.current.selectionStart === inputRef.current.selectionEnd) {
        inputRef.current.select();
      }
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener('focus', handleInputFocus);
      return () => {
        input.removeEventListener('focus', handleInputFocus);
      };
    }
  }, [value]);

  // Determine what to show in right section
  const rightSection = loading ? (
    <Loader size="xs" />
  ) : value ? (
    <ActionIcon
      variant="subtle"
      color="gray"
      onClick={() => onChange('')}
      aria-label="Clear search"
      size="sm"
    >
      <IconX size={16} />
    </ActionIcon>
  ) : null;

  return (
    <TextInput
      ref={inputRef}
      placeholder="Search ingresses..."
      leftSection={<IconSearch size={16} />}
      rightSection={rightSection}
      autoFocus
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      data-gramm="false"
      data-form-type="other"
      data-lpignore="true"
      data-1p-ignore
      style={{ flex: 1 }}
    />
  );
}
