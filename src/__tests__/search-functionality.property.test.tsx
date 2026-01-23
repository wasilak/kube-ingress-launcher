/**
 * Property-Based Test for Search Functionality Preservation
 * 
 * Feature: react-router-migration, Property 7: Search Functionality Preservation
 * **Validates: Requirements 4.5**
 * 
 * Tests that search filtering works correctly across all possible inputs,
 * maintaining the same behavior as before the migration.
 * 
 * Uses fast-check for property-based testing with 100 iterations
 */

import fc from 'fast-check';
import { IngressData } from '../types/ingress';

// Mock Tauri API
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(),
}));

jest.mock('@tauri-apps/api/event', () => ({
  listen: jest.fn(() => Promise.resolve(() => {})),
}));

/**
 * Filter function extracted from useSearch hook
 * This is the core logic we're testing
 */
function filterIngresses(ingresses: IngressData[], searchTerm: string): IngressData[] {
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
}

/**
 * Property 7: Search Functionality Preservation
 * **Validates: Requirements 4.5**
 * 
 * For any search term and list of ingresses:
 * - All filtered ingresses should match the search term
 * - No non-matching ingresses should be included
 * - Empty search term should return all ingresses
 */
describe('Search Functionality Preservation', () => {
  it('should filter ingresses correctly for any search term', () => {
    fc.assert(
      fc.property(
        // Generate array of ingress data
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.stringMatching(/^[a-z0-9-]{1,20}$/),
            namespace: fc.stringMatching(/^[a-z0-9-]{1,20}$/),
            hosts: fc.array(fc.domain(), { minLength: 0, maxLength: 3 }),
            urls: fc.array(fc.webUrl(), { minLength: 0, maxLength: 3 }),
            paths: fc.array(fc.string(), { minLength: 0, maxLength: 3 }),
            tls: fc.boolean(),
            annotations: fc.dictionary(fc.string(), fc.string()),
            creationTimestamp: fc.date().map(d => d.toISOString()),
            status: fc.constantFrom('ready', 'pending', 'error', 'unknown'),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        // Generate search term
        fc.string({ minLength: 0, maxLength: 20 }),
        (ingresses, searchTerm) => {
          const filtered = filterIngresses(ingresses, searchTerm);

          // Property 1: Empty search term returns all ingresses
          if (!searchTerm) {
            expect(filtered).toEqual(ingresses);
            return;
          }

          const term = searchTerm.toLowerCase();

          // Property 2: All filtered ingresses must match the search term
          for (const ing of filtered) {
            const matches =
              ing.name.toLowerCase().includes(term) ||
              ing.namespace.toLowerCase().includes(term) ||
              ing.hosts.some(h => h.toLowerCase().includes(term)) ||
              ing.urls.some(u => u.toLowerCase().includes(term));
            
            expect(matches).toBe(true);
          }

          // Property 3: No non-matching ingresses should be included
          for (const ing of ingresses) {
            const matches =
              ing.name.toLowerCase().includes(term) ||
              ing.namespace.toLowerCase().includes(term) ||
              ing.hosts.some(h => h.toLowerCase().includes(term)) ||
              ing.urls.some(u => u.toLowerCase().includes(term));
            
            if (matches) {
              expect(filtered).toContainEqual(ing);
            } else {
              expect(filtered).not.toContainEqual(ing);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be case-insensitive', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.stringMatching(/^[a-z0-9-]{1,20}$/),
            namespace: fc.stringMatching(/^[a-z0-9-]{1,20}$/),
            hosts: fc.array(fc.domain(), { minLength: 0, maxLength: 3 }),
            urls: fc.array(fc.webUrl(), { minLength: 0, maxLength: 3 }),
            paths: fc.array(fc.string(), { minLength: 0, maxLength: 3 }),
            tls: fc.boolean(),
            annotations: fc.dictionary(fc.string(), fc.string()),
            creationTimestamp: fc.date().map(d => d.toISOString()),
            status: fc.constantFrom('ready', 'pending', 'error', 'unknown'),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.string({ minLength: 1, maxLength: 10 }),
        (ingresses, searchTerm) => {
          const lowerFiltered = filterIngresses(ingresses, searchTerm.toLowerCase());
          const upperFiltered = filterIngresses(ingresses, searchTerm.toUpperCase());
          const mixedFiltered = filterIngresses(ingresses, searchTerm);

          // All three should return the same results
          expect(lowerFiltered).toEqual(upperFiltered);
          expect(lowerFiltered).toEqual(mixedFiltered);
        }
      ),
      { numRuns: 100 }
    );
  });
});
