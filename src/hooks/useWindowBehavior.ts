/**
 * Custom hook for managing window show/hide behavior
 * 
 * Handles:
 * - Escape key to hide window
 * - Cmd+, to open settings (macOS standard)
 * - Focus loss to hide window (with 100ms delay)
 * - Window centering on show
 * - Tray menu updates on visibility changes
 * 
 * Requirements: 2.4, 2.5, 2.6, 20.4.1, 20.4.2
 */

import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { emit, listen } from '@tauri-apps/api/event';

export function useWindowBehavior() {
  useEffect(() => {
    let focusLossTimeout: number | null = null;

    // Handle Escape key press and Cmd+, for settings
    const handleKeyDown = async (event: KeyboardEvent) => {
      // Handle Cmd+, (or Ctrl+, on non-Mac) to open settings
      if (event.key === ',' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        event.stopPropagation();
        
        try {
          await emit('open-settings');
        } catch (err) {
          console.error('[useWindowBehavior] Error emitting settings event:', err);
        }
        return;
      }
      
      if (event.key === 'Escape') {
        // Check if any modal or dialog is open by checking for Mantine modal overlay
        const modalOverlay = document.querySelector('[data-mantine-modal-overlay]');
        if (modalOverlay) {
          return; // Let the modal handle the Escape key
        }
        
        event.preventDefault();
        event.stopPropagation();
        
        // Hide window using Rust command
        try {
          await invoke('hide_window');
        } catch (err) {
          console.error('[useWindowBehavior] Error hiding window:', err);
        }
      }
    };

    // Setup listeners
    const setupListeners = async () => {
      // Listen for Tauri blur event
      const unlistenBlur = await listen('tauri://blur', async () => {
        // Check if a modal is open - don't hide if modal is open
        const modalOverlay = document.querySelector('[data-mantine-modal-overlay]');
        if (modalOverlay) {
          return;
        }
        
        // Clear any existing timeout
        if (focusLossTimeout !== null) {
          clearTimeout(focusLossTimeout);
        }

        // Hide window after 100ms delay
        focusLossTimeout = setTimeout(async () => {
          try {
            await invoke('hide_window');
          } catch (err) {
            console.error('[useWindowBehavior] Failed to hide window:', err);
          }
        }, 100) as unknown as number;
      });

      // Listen for Tauri focus event
      const unlistenFocus = await listen('tauri://focus', () => {
        // Clear the timeout if window regains focus
        if (focusLossTimeout !== null) {
          clearTimeout(focusLossTimeout);
          focusLossTimeout = null;
        }
      });

      return () => {
        unlistenBlur();
        unlistenFocus();
      };
    };

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown, true);
    
    // Setup Tauri listeners
    let cleanupTauriListeners: (() => void) | null = null;
    setupListeners().then((cleanup) => {
      cleanupTauriListeners = cleanup;
    });

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      
      if (cleanupTauriListeners) {
        cleanupTauriListeners();
      }
      
      if (focusLossTimeout !== null) {
        clearTimeout(focusLossTimeout);
      }
    };
  }, []);
}
