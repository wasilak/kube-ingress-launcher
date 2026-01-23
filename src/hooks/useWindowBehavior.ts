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
import { emit } from '@tauri-apps/api/event';

export function useWindowBehavior() {
  useEffect(() => {
    console.log('[useWindowBehavior] Hook initialized');
    const window = getCurrentWindow();
    let focusLossTimeout: number | null = null;
    let unlistenFocusChanged: (() => void) | null = null;

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

    // Setup Tauri window event listeners
    const setupWindowListeners = async () => {
      console.log('[useWindowBehavior] Setting up Tauri window event listeners');
      
      // Listen for focus change events from Tauri
      unlistenFocusChanged = await window.onFocusChanged(({ payload: focused }) => {
        console.log('[useWindowBehavior] Tauri focus changed:', focused);
        
        if (!focused) {
          // Window lost focus
          console.log('[useWindowBehavior] Window blur detected via Tauri, scheduling hide in 100ms');
          
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
        } else {
          // Window gained focus
          console.log('[useWindowBehavior] Window focus detected via Tauri, canceling hide timeout');
          
          // Clear the timeout if window regains focus
          if (focusLossTimeout !== null) {
            clearTimeout(focusLossTimeout);
            focusLossTimeout = null;
          }
        }
      });
      
      console.log('[useWindowBehavior] Tauri window event listeners set up');
    };

    console.log('[useWindowBehavior] Setting up event listeners');

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    
    // Setup Tauri window listeners
    setupWindowListeners();
    
    console.log('[useWindowBehavior] Event listeners attached successfully');

    // Cleanup
    return () => {
      console.log('[useWindowBehavior] Cleaning up event listeners');
      document.removeEventListener('keydown', handleKeyDown, true);
      
      if (unlistenFocusChanged) {
        unlistenFocusChanged();
      }
      
      if (focusLossTimeout !== null) {
        clearTimeout(focusLossTimeout);
      }
    };
  }, []);
}
