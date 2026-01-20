/**
 * Custom hook for managing ingress data from Tauri backend
 * 
 * This hook:
 * - Fetches ingress data on mount via get_ingresses command
 * - Listens for "ingresses-updated" events from background refresh
 * - Provides loading, error, and lastUpdated states
 * 
 * Requirements: 6.1-6.11
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { IngressData, IngressResponse, ErrorInfo } from '../types/ingress';

interface UseIngressesReturn {
  ingresses: IngressData[];
  loading: boolean;
  error: ErrorInfo | null;
  lastUpdated: string | null;
}

export function useIngresses(): UseIngressesReturn {
  const [ingresses, setIngresses] = useState<IngressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchIngresses = async () => {
    try {
      const response = await invoke<IngressResponse>('get_ingresses');
      setIngresses(response.ingresses);
      setError(response.error);
      setLastUpdated(response.lastUpdated);
    } catch (err) {
      setError({
        message: 'Failed to fetch ingresses',
        details: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchIngresses();

    // Listen for refresh events from backend
    const setupListener = async () => {
      const unlisten = await listen('ingresses-updated', () => {
        fetchIngresses();
      });

      return unlisten;
    };

    let unlistenPromise = setupListener();

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  return { ingresses, loading, error, lastUpdated };
}
