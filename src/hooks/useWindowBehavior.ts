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
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { emit, listen } from '@tauri-apps/api/event';

export function useWindowBehavior() {
  useEffect(() => {
    console.log('[useWindowBehavior] Hook initialized');
    const window = getCurrentWindow();
    let focusLossTimeout: number | null = null;

    // Handle Escape key press and Cmd+, for settings
    const handleKeyDown = async (event: KeyboardEvent) => {
      console.log('[useWindowBehavior] Key pressed:', event.key, 'code:', event.code);
      
      // Handle Cmd+, (or Ctrl+, on non-Mac) to open settings
      if (event.key === ',' && (event.metaKey || event.ctrlKey)) {
        console.log('[useWindowBehavior] Cmd+, pressed, opening settings');
        event.preventDefault();
        event.stopPropagation();
        
        try {
          await emit('open-settings');
          console.log('[useWindowBehavior] Settings event emitted');
        } catch (err) {
          console.error('[useWindowBehavior] Error emitting settings event:', err);
        }
        return;
      }
      
      if (event.key === 'Escape') {
        // Check if any modal or dialog is open by checking for Mantine modal overlay
        const modalOverlay = document.querySelector('[data-mantine-modal-overlay]');
        if (modalOverlay) {
          console.log('[useWindowBehavior] Escape key pressed but modal is open, ignoring');
          return; // Let the modal handle the Escape key
        }
        
        console.log('[useWindowBehavior] Escape key pressed, hiding window');
        event.preventDefault();
        event.stopPropagation();
        
        try {
          await window.hide();
          console.log('[useWindowBehavior] Window hidden successfully');
          
          // Update tray menu to show "Show"
          await invoke('update_tray_menu_state', { isVisible: false });
          console.log('[useWindowBehavior] Tray menu updated');
        } catch (err) {
          console.error('[useWindowBehavior] Error hiding window or updating tray:', err);
        }
      }
    };

    // Setup listeners
    const setupListeners = async () => {
      console.log('[useWindowBehavior] Setting up event listeners');
      
      // Listen for Tauri blur event
      const unlistenBlur = await listen('tauri://blur', async () => {
        console.log('[useWindowBehavior] Tauri blur event received');
        
        // Check if a modal is open - don't hide if modal is open
        const modalOverlay = document.querySelector('[data-mantine-modal-overlay]');
        if (modalOverlay) {
          console.log('[useWindowBehavior] Modal is open, not hiding on blur');
          return;
        }
        
        // Clear any existing timeout
        if (focusLossTimeout !== null) {
          clearTimeout(focusLossTimeout);
        }

        // Hide window after 100ms delay
        focusLossTimeout = setTimeout(async () => {
          console.log('[useWindowBehavior] Hiding window after blur timeout');
          try {
            await window.hide();
            // Update tray menu to show "Show"
            await invoke('update_tray_menu_state', { isVisible: false });
          } catch (err) {
            console.error('[useWindowBehavior] Failed to hide window or update tray:', err);
          }
        }, 100) as unknown as number;
      });

      // Listen for Tauri focus event
      const unlistenFocus = await listen('tauri://focus', () => {
        console.log('[useWindowBehavior] Tauri focus event received, canceling hide timeout');
        
        // Clear the timeout if window regains focus
        if (focusLossTimeout !== null) {
          clearTimeout(focusLossTimeout);
          focusLossTimeout = null;
        }
      });

      console.log('[useWindowBehavior] Tauri event listeners set up');

      return () => {
        console.log('[useWindowBehavior] Cleaning up Tauri event listeners');
        unlistenBlur();
        unlistenFocus();
      };
    };

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    
    // Setup Tauri listeners
    let cleanupTauriListeners: (() => void) | null = null;
    setupListeners().then((cleanup) => {
      cleanupTauriListeners = cleanup;
    });
    
    console.log('[useWindowBehavior] Event listeners attached successfully');

    // Cleanup
    return () => {
      console.log('[useWindowBehavior] Cleaning up event listeners');
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
