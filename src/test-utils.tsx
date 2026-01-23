/**
 * Test utilities for React component testing
 * 
 * Provides wrappers and helpers for testing components that require:
 * - MantineProvider for Mantine UI components
 * - Router context for navigation
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

/**
 * Custom render function that wraps components with necessary providers
 * 
 * @param ui - Component to render
 * @param options - Render options including initialEntries for router
 * @returns Render result from @testing-library/react
 */
export function renderWithProviders(
  ui: ReactElement,
  { initialEntries = ['/'], ...renderOptions }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MantineProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </MantineProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
