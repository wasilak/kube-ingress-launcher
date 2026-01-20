/**
 * Custom hook for managing window show/hide behavior
 * 
 * Handles:
 * - Escape key to hide window
 * - Focus loss to hide window (with 100ms delay)
 * - Window centering on show
 * 
 * Requirements: 2.4, 2.5, 2.6
 */

import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function useWindowBehavior() {
  useEffect(() => {
    const window = getCurrentWindow();
    let focusLossTimeout: number | null = null;

    // Handle Escape key press
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        window.hide();
      }
    };

    // Handle window blur (focus loss)
    const handleBlur = () => {
      // Clear any existing timeout
      if (focusLossTimeout !== null) {
        clearTimeout(focusLossTimeout);
      }

      // Hide window after 100ms delay
      focusLossTimeout = setTimeout(() => {
        window.hide();
      }, 100) as unknown as number;
    };

    // Handle window focus (cancel hide if window regains focus)
    const handleFocus = () => {
      // Clear the timeout if window regains focus
      if (focusLossTimeout !== null) {
        clearTimeout(focusLossTimeout);
        focusLossTimeout = null;
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    globalThis.window.addEventListener('blur', handleBlur);
    globalThis.window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      globalThis.window.removeEventListener('blur', handleBlur);
      globalThis.window.removeEventListener('focus', handleFocus);
      
      if (focusLossTimeout !== null) {
        clearTimeout(focusLossTimeout);
      }
    };
  }, []);
}
