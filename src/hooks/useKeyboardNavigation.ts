/**
 * Custom hook for keyboard navigation in the ingress list
 * 
 * Handles:
 * - Arrow Up/Down to navigate items
 * - Enter to select the current item
 * - Escape to close window (handled by useWindowBehavior)
 * 
 * Requirements: 8.5, 11.4
 */

import { useState, useEffect } from 'react';
import { IngressData } from '../types/ingress';

interface UseKeyboardNavigationProps {
  /** List of items to navigate */
  items: IngressData[];
  
  /** Callback when an item is selected with Enter key */
  onSelect: (item: IngressData) => void;
  
  /** Whether keyboard navigation is enabled */
  enabled?: boolean;
}

export function useKeyboardNavigation({
  items,
  onSelect,
  enabled = true,
}: UseKeyboardNavigationProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Reset selected index when items change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [items]);

  // Handle keyboard events
  useEffect(() => {
    if (!enabled || items.length === 0) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => {
            const next = prev + 1;
            return next >= items.length ? 0 : next;
          });
          break;

        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => {
            const next = prev - 1;
            return next < 0 ? items.length - 1 : next;
          });
          break;

        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < items.length) {
            onSelect(items[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, items, selectedIndex, onSelect]);

  return {
    selectedIndex,
    setSelectedIndex,
  };
}
