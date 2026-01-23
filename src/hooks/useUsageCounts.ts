/**
 * Custom hook for managing usage count badges
 * 
 * This hook:
 * - Fetches all usage counts on mount via get_all_counts command
 * - Listens for "usage-stats-updated" events from backend
 * - Provides recordOpen function to track link opens
 * - Optimistically updates local state after recording
 * 
 * Requirements: 1.1, 2.2, 2.5, 15.1
 */

import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface UseUsageCountsReturn {
  /** Map of host to usage count */
  counts: Record<string, number>;
  /** Record a link open event for a host */
  recordOpen: (host: string) => Promise<void>;
}

export function useUsageCounts(): UseUsageCountsReturn {
  const [counts, setCounts] = useState<Record<string, number>>({});

  const loadCounts = useCallback(async () => {
    try {
      const result = await invoke<Record<string, number>>('get_all_counts');
      setCounts(result);
    } catch (err) {
      console.error('Failed to load usage counts:', err);
      // Don't throw - gracefully degrade to empty counts
    }
  }, []);

  const recordOpen = useCallback(async (host: string) => {
    try {
      // Optimistically update local state
      setCounts((prev) => ({
        ...prev,
        [host]: (prev[host] || 0) + 1,
      }));

      // Record in backend
      await invoke('record_link_open', { host });
    } catch (err) {
      console.error('Failed to record link open:', err);
      // Revert optimistic update on error
      await loadCounts();
    }
  }, [loadCounts]);

  useEffect(() => {
    // Initial load
    loadCounts();

    // Listen for usage stats updates from backend
    const setupListener = async () => {
      const unlisten = await listen('usage-stats-updated', () => {
        loadCounts();
      });

      return unlisten;
    };

    let unlistenPromise = setupListener();

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [loadCounts]);

  return { counts, recordOpen };
}
