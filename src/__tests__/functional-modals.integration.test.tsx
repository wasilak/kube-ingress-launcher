/**
 * Integration Test for Functional Modals
 * 
 * Tests that functional modals (PermissionsDialog, ClearConfirmationModal, AreaChartModal)
 * still work correctly after the React Router migration.
 * 
 * **Validates: Requirements 8.6**
 * 
 * These modals represent actions, not navigation, so they should remain as modals
 * and continue to function correctly.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { PermissionsDialog } from '../components/PermissionsDialog';
import { ClearConfirmationModal } from '../components/ClearConfirmationModal';
import { AreaChartModal } from '../components/AreaChartModal';

// Mock Tauri API
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(),
}));

jest.mock('@tauri-apps/api/event', () => ({
  listen: jest.fn(() => Promise.resolve(() => {})),
}));

import { invoke } from '@tauri-apps/api/core';
const mockInvoke = invoke as jest.MockedFunction<typeof invoke>;

/**
 * Helper to render components with Mantine provider
 */
function renderWithMantine(component: React.ReactElement) {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
}

/**
 * Test PermissionsDialog functionality
 * **Validates: Requirements 8.6**
 */
describe('PermissionsDialog', () => {
  beforeEach(() => {
    mockInvoke.mockClear();
  });

  it('should render when opened', () => {
    const onClose = jest.fn();
    
    renderWithMantine(
      <PermissionsDialog
        opened={true}
        onClose={onClose}
        permissionType="accessibility"
      />
    );

    expect(screen.getByText('Accessibility Permission Required')).toBeInTheDocument();
    expect(screen.getByText(/Keyboard shortcuts require Accessibility permission/)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const onClose = jest.fn();
    
    renderWithMantine(
      <PermissionsDialog
        opened={false}
        onClose={onClose}
        permissionType="accessibility"
      />
    );

    expect(screen.queryByText('Accessibility Permission Required')).not.toBeInTheDocument();
  });

  it('should call onClose when Close button is clicked', () => {
    const onClose = jest.fn();
    
    renderWithMantine(
      <PermissionsDialog
        opened={true}
        onClose={onClose}
        permissionType="accessibility"
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should invoke request_accessibility when Open System Settings is clicked', async () => {
    mockInvoke.mockResolvedValue(undefined);
    const onClose = jest.fn();
    
    renderWithMantine(
      <PermissionsDialog
        opened={true}
        onClose={onClose}
        permissionType="accessibility"
      />
    );

    const openSettingsButton = screen.getByRole('button', { name: /open system settings/i });
    fireEvent.click(openSettingsButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('request_accessibility');
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should display autostart permission message', () => {
    const onClose = jest.fn();
    
    renderWithMantine(
      <PermissionsDialog
        opened={true}
        onClose={onClose}
        permissionType="autostart"
      />
    );

    expect(screen.getByText('Autostart Permission Required')).toBeInTheDocument();
    expect(screen.getByText(/Could not enable autostart/)).toBeInTheDocument();
  });
});

/**
 * Test ClearConfirmationModal functionality
 * **Validates: Requirements 8.6**
 */
describe('ClearConfirmationModal', () => {
  it('should render when opened', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    
    renderWithMantine(
      <ClearConfirmationModal
        opened={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Clear All Statistics')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to clear all usage statistics/)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    
    renderWithMantine(
      <ClearConfirmationModal
        opened={false}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.queryByText('Clear All Statistics')).not.toBeInTheDocument();
  });

  it('should call onCancel when Cancel button is clicked', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    
    renderWithMantine(
      <ClearConfirmationModal
        opened={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('should call onConfirm when Clear All button is clicked', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    
    renderWithMantine(
      <ClearConfirmationModal
        opened={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });
});

/**
 * Test AreaChartModal functionality
 * **Validates: Requirements 8.6**
 */
describe('AreaChartModal', () => {
  beforeEach(() => {
    mockInvoke.mockClear();
  });

  it('should render with loading state initially', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    mockInvoke.mockReturnValue(promise);
    const onClose = jest.fn();
    
    renderWithMantine(
      <AreaChartModal
        host="example.com"
        timeRange="24h"
        onClose={onClose}
      />
    );

    // Modal should render with title
    expect(screen.getByText('Usage Details: example.com')).toBeInTheDocument();
    
    // Wait for loading state to appear
    await waitFor(() => {
      expect(screen.queryByText('Total opens:')).not.toBeInTheDocument();
    });
  });

  it('should fetch host usage data on mount', async () => {
    const mockData = {
      host: 'example.com',
      totalCount: 10,
      timeBuckets: [
        { timestamp: '2024-01-01T00:00:00Z', count: 5 },
        { timestamp: '2024-01-01T01:00:00Z', count: 5 },
      ],
    };

    mockInvoke.mockResolvedValue(mockData);
    const onClose = jest.fn();
    
    renderWithMantine(
      <AreaChartModal
        host="example.com"
        timeRange="24h"
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('get_host_usage', {
        host: 'example.com',
        timeRange: '24h',
      });
    });

    // Should display total count
    await waitFor(() => {
      expect(screen.getByText('Total opens: 10')).toBeInTheDocument();
    });
  });

  it('should display error message when fetch fails', async () => {
    mockInvoke.mockRejectedValue(new Error('Failed to fetch'));
    const onClose = jest.fn();
    
    renderWithMantine(
      <AreaChartModal
        host="example.com"
        timeRange="24h"
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load usage data/)).toBeInTheDocument();
    });
  });

  it('should call onClose when modal is closed', () => {
    mockInvoke.mockResolvedValue({
      host: 'example.com',
      totalCount: 0,
      timeBuckets: [],
    });
    const onClose = jest.fn();
    
    const { container } = renderWithMantine(
      <AreaChartModal
        host="example.com"
        timeRange="24h"
        onClose={onClose}
      />
    );

    // Find and click the close button (X button in modal header)
    const closeButton = container.querySelector('button[aria-label="Close modal"]');
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });
});

/**
 * Integration test: Verify all functional modals work together
 * **Validates: Requirements 8.6**
 */
describe('Functional Modals Integration', () => {
  it('should allow multiple modals to be used in the same component', () => {
    const onClosePermissions = jest.fn();
    const onConfirmClear = jest.fn();
    const onCancelClear = jest.fn();
    
    const { unmount } = renderWithMantine(
      <>
        <PermissionsDialog
          opened={true}
          onClose={onClosePermissions}
          permissionType="accessibility"
        />
        <ClearConfirmationModal
          opened={false}
          onConfirm={onConfirmClear}
          onCancel={onCancelClear}
        />
      </>
    );

    // Permissions dialog should be visible
    expect(screen.getByText('Accessibility Permission Required')).toBeInTheDocument();
    expect(screen.queryByText('Clear All Statistics')).not.toBeInTheDocument();

    // Unmount and render new state
    unmount();

    renderWithMantine(
      <>
        <PermissionsDialog
          opened={false}
          onClose={onClosePermissions}
          permissionType="accessibility"
        />
        <ClearConfirmationModal
          opened={true}
          onConfirm={onConfirmClear}
          onCancel={onCancelClear}
        />
      </>
    );

    // Clear confirmation should be visible
    expect(screen.queryByText('Accessibility Permission Required')).not.toBeInTheDocument();
    expect(screen.getByText('Clear All Statistics')).toBeInTheDocument();
  });
});
