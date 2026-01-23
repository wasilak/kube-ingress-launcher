/**
 * StatisticsView component - Main statistics window displaying usage analytics
 * 
 * This component provides a comprehensive view of link usage statistics:
 * - Time range selector for filtering statistics
 * - Table layout with rank, host, count, and sparkline columns
 * - Clear all statistics functionality with confirmation
 * - Detailed area chart modal for individual hosts
 * 
 * Optimizations:
 * - Time range changes are debounced to reduce unnecessary API calls
 * - Callback functions are memoized with useCallback
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.4, 7.1, 7.2, 7.9, 8.1, 9.1, 9.2, 9.3, 13.2, 13.3, 14.4
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stack, Group, Title, Select, Loader, Alert, Button, Text, Table, ActionIcon, ScrollArea, Container } from '@mantine/core';
import { Sparkline } from '@mantine/charts';
import { useDebouncedValue } from '@mantine/hooks';
import { invoke } from '@tauri-apps/api/core';
import { IconTrash, IconChartLine } from '@tabler/icons-react';
import { AreaChartModal } from './AreaChartModal';
import { ClearConfirmationModal } from './ClearConfirmationModal';
import { useUsageStats } from '../hooks/useUsageStats';
import { TIME_RANGE_OPTIONS, DEFAULT_TIME_RANGE } from '../constants/timeRanges';
import type { TimeRange } from '../types/usage';
import type { Settings } from '../types/ingress';

/**
 * StatisticsView component displays usage statistics in a table format
 * 
 * Features:
 * - Time range selector (1 hour to 30 days)
 * - Table with rank, host, count, and sparkline columns
 * - Loading and error states
 * - Clear all statistics with confirmation modal
 * - Detailed area chart modal for individual hosts
 * - Clickable sparklines to open detailed view
 * 
 * Optimizations:
 * - Debounced time range changes (300ms) to reduce API calls
 * - Memoized callbacks to prevent unnecessary re-renders
 * - Memoized select data to avoid recreation on every render
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.4, 7.1, 7.2, 7.9, 8.1, 9.1, 9.2, 9.3, 13.2, 13.3, 14.4
 */
export function StatisticsView() {
  // Time range state (default: 7 days from constants)
  const [timeRange, setTimeRange] = useState<TimeRange>(DEFAULT_TIME_RANGE);
  
  // Debounce time range changes to reduce API calls (300ms delay)
  const [debouncedTimeRange] = useDebouncedValue(timeRange, 300);
  
  // Selected host for area chart modal
  const [selectedHost, setSelectedHost] = useState<string | null>(null);
  
  // Confirmation modal state for clear all
  const [clearAllConfirmOpen, setClearAllConfirmOpen] = useState(false);

  // Load time range preference from settings on mount
  useEffect(() => {
    const loadTimeRangePreference = async () => {
      try {
        const settings = await invoke<Settings>('get_settings');
        if (settings.statisticsTimeRange) {
          setTimeRange(settings.statisticsTimeRange as TimeRange);
        }
      } catch (err) {
        console.error('Failed to load time range preference:', err);
        // Continue with default value
      }
    };

    loadTimeRangePreference();
  }, []);

  // Save time range preference to settings when changed (debounced)
  useEffect(() => {
    const saveTimeRangePreference = async () => {
      try {
        const settings = await invoke<Settings>('get_settings');
        await invoke('update_settings', {
          settings: { ...settings, statisticsTimeRange: debouncedTimeRange },
        });
      } catch (err) {
        console.error('Failed to save time range preference:', err);
        // Continue anyway - preference just won't persist
      }
    };

    // Only save if debounced value is different from initial load
    if (debouncedTimeRange !== DEFAULT_TIME_RANGE) {
      saveTimeRangePreference();
    }
  }, [debouncedTimeRange]);

  // Fetch usage statistics with the debounced time range
  const { stats, loading, error, clearHost, clearAll } = useUsageStats(debouncedTimeRange);

  // Memoize select data to avoid recreation on every render
  const selectData = useMemo(
    () => TIME_RANGE_OPTIONS.map(option => ({
      value: option.value,
      label: option.label,
    })),
    []
  );

  /**
   * Handle time range selector change
   * Updates local state immediately for responsive UI
   */
  const handleTimeRangeChange = useCallback((value: string | null) => {
    if (value) {
      setTimeRange(value as TimeRange);
    }
  }, []);

  /**
   * Handle clear button click for individual host
   * Clears statistics for the specified host
   */
  const handleClearHost = useCallback(async (host: string) => {
    try {
      await clearHost(host);
    } catch (err) {
      console.error('Failed to clear host:', err);
    }
  }, [clearHost]);

  /**
   * Handle clear all button click
   * Shows confirmation modal before clearing all statistics
   */
  const handleClearAllClick = useCallback(() => {
    setClearAllConfirmOpen(true);
  }, []);

  /**
   * Handle clear all confirmation
   * Clears all statistics and closes confirmation modal
   */
  const handleClearAllConfirm = useCallback(async () => {
    try {
      await clearAll();
      setClearAllConfirmOpen(false);
    } catch (err) {
      console.error('Failed to clear all statistics:', err);
    }
  }, [clearAll]);

  /**
   * Handle clear all cancellation
   * Closes confirmation modal without clearing
   */
  const handleClearAllCancel = useCallback(() => {
    setClearAllConfirmOpen(false);
  }, []);

  /**
   * Handle sparkline click
   * Opens area chart modal for the selected host
   */
  const handleSparklineClick = useCallback((host: string) => {
    setSelectedHost(host);
  }, []);

  /**
   * Handle area chart modal close
   * Closes the modal and clears selected host
   */
  const handleModalClose = useCallback(() => {
    setSelectedHost(null);
  }, []);

  return (
    <ScrollArea h="calc(100vh - 120px)" scrollbarSize={8} scrollbars="y">
      <Container size="lg" px="md">
        <Stack gap="md">
          {/* Header with title and time range selector */}
          <Group justify="space-between">
            <Title order={2}>Usage Statistics</Title>
          <Select
            value={timeRange}
            onChange={handleTimeRangeChange}
            data={selectData}
            w={150}
          />
        </Group>

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Loader />
        </div>
      )}

      {/* Error state */}
      {error && (
        <Alert color="red" title="Failed to Load Statistics">
          {error}
        </Alert>
      )}

      {/* Statistics table */}
      {!loading && !error && (
        <>
          {stats.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              No usage statistics available
            </Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '60px' }}>#</Table.Th>
                  <Table.Th>Host</Table.Th>
                  <Table.Th style={{ width: '80px', textAlign: 'right' }}>Opens</Table.Th>
                  <Table.Th style={{ width: '200px' }}>Activity</Table.Th>
                  <Table.Th style={{ width: '100px' }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {stats.map((stat, index) => {
                  const sparklineData = stat.timeBuckets.map(b => b.count);
                  
                  return (
                    <Table.Tr key={stat.host}>
                      <Table.Td style={{ fontWeight: 500, color: 'var(--mantine-color-dimmed)' }}>
                        {index + 1}
                      </Table.Td>
                      <Table.Td style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                        {stat.host}
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right', fontWeight: 500 }}>
                        {stat.totalCount}
                      </Table.Td>
                      <Table.Td>
                        <div
                          onClick={() => handleSparklineClick(stat.host)}
                          style={{ cursor: 'pointer' }}
                        >
                          <Sparkline
                            w="100%"
                            h={40}
                            data={sparklineData}
                            curveType="linear"
                            color="blue"
                            fillOpacity={0.6}
                            strokeWidth={2}
                          />
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" justify="flex-end">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => handleSparklineClick(stat.host)}
                            title="View details"
                          >
                            <IconChartLine size={18} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleClearHost(stat.host)}
                            title="Clear statistics"
                          >
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          )}

          {/* Clear all button */}
          {stats.length > 0 && (
            <Button
              color="red"
              variant="light"
              onClick={handleClearAllClick}
              fullWidth
              mt="md"
            >
              Clear All Statistics
            </Button>
          )}
        </>
      )}

      {/* Clear all confirmation modal */}
      <ClearConfirmationModal
        opened={clearAllConfirmOpen}
        onConfirm={handleClearAllConfirm}
        onCancel={handleClearAllCancel}
      />

      {/* Area chart modal for detailed view */}
      {selectedHost && (
        <AreaChartModal
          host={selectedHost}
          timeRange={debouncedTimeRange}
          onClose={handleModalClose}
        />
      )}
        </Stack>
      </Container>
    </ScrollArea>
  );
}
