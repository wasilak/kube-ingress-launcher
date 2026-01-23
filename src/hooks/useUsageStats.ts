/**
 * Custom hook for managing usage statistics with time range filtering
 * 
 * This hook:
 * - Fetches aggregated usage stats for a specific time range via get_usage_stats command
 * - Listens for "usage-stats-updated" events from backend
 * - Provides clearHost function to remove stats for a specific host
 * - Provides clearAll function to remove all statistics
 * - Provides refresh function to manually reload stats
 * - Automatically refreshes when time range changes
 * 
 * Requirements: 4.3, 4.5, 5.2, 5.4, 7.9, 8.2, 8.3, 8.4, 8.5, 9.4, 9.6, 9.7
 */

import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { AggregatedUsage, TimeRange } from '../types/usage';

interface UseUsageStatsReturn {
  /** Aggregated usage statistics for all hosts */
  stats: AggregatedUsage[];
  /** Loading state */
  loading: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** Clear statistics for a specific host */
  clearHost: (host: string) => Promise<void>;
  /** Clear all statistics */
  clearAll: () => Promise<void>;
  /** Manually refresh statistics */
  refresh: () => Promise<void>;
}

export function useUsageStats(timeRange: TimeRange): UseUsageStatsReturn {
  const [stats, setStats] = useState<AggregatedUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<AggregatedUsage[]>('get_usage_stats', { 
        timeRange 
      });
      setStats(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Failed to load usage stats:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const clearHost = useCallback(async (host: string) => {
    try {
      await invoke('clear_host_usage', { host });
      // Stats will be updated via event listener
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to clear host usage:', err);
      // Don't throw - set error state and continue operation
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await invoke('clear_all_usage');
      // Stats will be updated via event listener
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to clear all usage:', err);
      // Don't throw - set error state and continue operation
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadStats();
  }, [loadStats]);

  useEffect(() => {
    // Initial load when time range changes
    loadStats();

    // Listen for usage stats updates from backend
    const setupListener = async () => {
      const unlisten = await listen('usage-stats-updated', () => {
        loadStats();
      });

      return unlisten;
    };

    let unlistenPromise = setupListener();

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [loadStats]);

  return { 
    stats, 
    loading, 
    error, 
    clearHost, 
    clearAll, 
    refresh 
  };
}
