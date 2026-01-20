/**
 * Custom hook for filtering ingress data based on search term
 * 
 * This hook:
 * - Accepts a list of ingresses and a search term
 * - Filters by name, namespace, host, or URL (case-insensitive substring match)
 * - Uses useMemo for performance optimization
 * 
 * Requirements: 7.3
 */

import { useState, useMemo } from 'react';
import { IngressData } from '../types/ingress';

interface UseSearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredIngresses: IngressData[];
}

export function useSearch(ingresses: IngressData[]): UseSearchReturn {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIngresses = useMemo(() => {
    if (!searchTerm) {
      return ingresses;
    }

    const term = searchTerm.toLowerCase();

    return ingresses.filter((ingress) => {
      // Match against name
      if (ingress.name.toLowerCase().includes(term)) {
        return true;
      }

      // Match against namespace
      if (ingress.namespace.toLowerCase().includes(term)) {
        return true;
      }

      // Match against any host
      if (ingress.hosts.some((host) => host.toLowerCase().includes(term))) {
        return true;
      }

      // Match against any URL
      if (ingress.urls.some((url) => url.toLowerCase().includes(term))) {
        return true;
      }

      return false;
    });
  }, [ingresses, searchTerm]);

  return { searchTerm, setSearchTerm, filteredIngresses };
}
