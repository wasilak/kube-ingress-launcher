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
 * - Auto-selects text when window becomes visible
 * - Shows loading indicator when data is being fetched
 * - Clear button (X) to reset search when text is present
 * - Uses Mantine TextInput with search icon
 * 
 * Requirements: 7.2, 7.4, 12.4, 18.1
 */
export function SearchInput({ value, onChange, loading }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-select text when window becomes visible
  useEffect(() => {
    const handleWindowShow = async () => {
      // Small delay to ensure input is rendered and focused
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    };

    // Listen for window show events
    const setupListener = async () => {
      // Initial selection if there's text
      if (value && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }

      // Listen for focus events on the window
      const handleFocus = () => {
        handleWindowShow();
      };

      globalThis.window.addEventListener('focus', handleFocus);

      return () => {
        globalThis.window.removeEventListener('focus', handleFocus);
      };
    };

    setupListener();
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
    />
  );
}
