/**
 * Custom hook for managing window show/hide behavior
 * 
 * Handles:
 * - Escape key to hide window
 * - Focus loss to hide window (with 100ms delay)
 * - Window centering on show
 * - Tray menu updates on visibility changes
 * 
 * Requirements: 2.4, 2.5, 2.6, 20.4.1, 20.4.2
 */

import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';

export function useWindowBehavior() {
  useEffect(() => {
    console.log('[useWindowBehavior] Hook initialized');
    const window = getCurrentWindow();
    let focusLossTimeout: number | null = null;

    // Handle Escape key press
    const handleKeyDown = async (event: KeyboardEvent) => {
      console.log('[useWindowBehavior] Key pressed:', event.key, 'code:', event.code);
      
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

    // Handle window blur (focus loss)
    const handleBlur = () => {
      console.log('[useWindowBehavior] Window blur detected, scheduling hide in 100ms');
      
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
        await window.hide();
        // Update tray menu to show "Show"
        try {
          await invoke('update_tray_menu_state', { isVisible: false });
        } catch (err) {
          console.error('[useWindowBehavior] Failed to update tray menu:', err);
        }
      }, 100) as unknown as number;
    };

    // Handle window focus (cancel hide if window regains focus)
    const handleFocus = () => {
      console.log('[useWindowBehavior] Window focus detected, canceling hide timeout');
      
      // Clear the timeout if window regains focus
      if (focusLossTimeout !== null) {
        clearTimeout(focusLossTimeout);
        focusLossTimeout = null;
      }
    };

    console.log('[useWindowBehavior] Setting up event listeners');
    console.log('[useWindowBehavior] Document:', document);
    console.log('[useWindowBehavior] Window:', globalThis.window);

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    globalThis.window.addEventListener('blur', handleBlur);
    globalThis.window.addEventListener('focus', handleFocus);
    
    console.log('[useWindowBehavior] Event listeners attached successfully');

    // Cleanup
    return () => {
      console.log('[useWindowBehavior] Cleaning up event listeners');
      document.removeEventListener('keydown', handleKeyDown, true);
      globalThis.window.removeEventListener('blur', handleBlur);
      globalThis.window.removeEventListener('focus', handleFocus);
      
      if (focusLossTimeout !== null) {
        clearTimeout(focusLossTimeout);
      }
    };
  }, []);
}
