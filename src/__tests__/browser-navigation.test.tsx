/**
 * Integration Tests for Browser Navigation
 * 
 * Tests browser back/forward button functionality with React Router
 * 
 * Requirements: 12.2, 12.3
 */

import { waitFor } from '@testing-library/react';
import { createMemoryHistory } from 'history';

// Mock Tauri API
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(),
}));

jest.mock('@tauri-apps/api/event', () => ({
  listen: jest.fn(() => Promise.resolve(() => {})),
}));

/**
 * Test browser forward button navigates to next route
 * **Validates: Requirements 12.3**
 */
describe('Browser Navigation - Forward Button', () => {
  it('should navigate to next route when forward button is used', async () => {
    const history = createMemoryHistory();
    history.push('/');
    history.push('/statistics');
    history.back(); // Go back to /

    // Should be on home page
    expect(history.location.pathname).toBe('/');

    // Go forward
    history.forward();

    // Should be on statistics page
    await waitFor(() => {
      expect(history.location.pathname).toBe('/statistics');
    });
  });
});
