/**
 * StatisticsView component - Main statistics window displaying usage analytics
 * 
 * This component provides a comprehensive view of link usage statistics:
 * - Time range selector for filtering statistics
 * - List of top opened ingresses with sparklines
 * - Clear all statistics functionality with confirmation
 * - Detailed area chart modal for individual hosts
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.4, 7.1, 7.2, 7.9, 8.1, 9.1, 9.2, 9.3, 14.4
 */

import { useState, useEffect } from 'react';
import { Stack, Group, Title, Select, Loader, Alert, ScrollArea, Button, Text } from '@mantine/core';
import { invoke } from '@tauri-apps/api/core';
import { StatisticsItem } from './StatisticsItem';
import { AreaChartModal } from './AreaChartModal';
import { ClearConfirmationModal } from './ClearConfirmationModal';
import { useUsageStats } from '../hooks/useUsageStats';
import { TIME_RANGE_OPTIONS, DEFAULT_TIME_RANGE } from '../constants/timeRanges';
import type { TimeRange } from '../types/usage';
import type { Settings } from '../types/ingress';

/**
 * StatisticsView component displays usage statistics with time range filtering
 * 
 * Features:
 * - Time range selector (1 hour to 30 days)
 * - List of statistics items with sparklines
 * - Loading and error states
 * - Clear all statistics with confirmation modal
 * - Detailed area chart modal for individual hosts
 * - Scrollable list for many statistics
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.4, 7.1, 7.2, 7.9, 8.1, 9.1, 9.2, 9.3, 14.4
 */
export function StatisticsView() {
  // Time range state (default: 7 days from constants)
  const [timeRange, setTimeRange] = useState<TimeRange>(DEFAULT_TIME_RANGE);
  
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

  // Save time range preference to settings when changed
  const handleTimeRangeChange = async (value: string | null) => {
    if (!value) return;
    
    const newTimeRange = value as TimeRange;
    setTimeRange(newTimeRange);

    try {
      const settings = await invoke<Settings>('get_settings');
      await invoke('update_settings', {
        settings: { ...settings, statisticsTimeRange: newTimeRange },
      });
    } catch (err) {
      console.error('Failed to save time range preference:', err);
      // Continue anyway - preference just won't persist
    }
  };

  // Fetch usage statistics with the selected time range
  const { stats, loading, error, clearHost, clearAll } = useUsageStats(timeRange);

  /**
   * Handle clear button click for individual host
   * Clears statistics for the specified host
   */
  const handleClearHost = async (host: string) => {
    try {
      await clearHost(host);
    } catch (err) {
      console.error('Failed to clear host:', err);
    }
  };

  /**
   * Handle clear all button click
   * Shows confirmation modal before clearing all statistics
   */
  const handleClearAllClick = () => {
    setClearAllConfirmOpen(true);
  };

  /**
   * Handle clear all confirmation
   * Clears all statistics and closes confirmation modal
   */
  const handleClearAllConfirm = async () => {
    try {
      await clearAll();
      setClearAllConfirmOpen(false);
    } catch (err) {
      console.error('Failed to clear all statistics:', err);
    }
  };

  /**
   * Handle clear all cancellation
   * Closes confirmation modal without clearing
   */
  const handleClearAllCancel = () => {
    setClearAllConfirmOpen(false);
  };

  /**
   * Handle sparkline click
   * Opens area chart modal for the selected host
   */
  const handleSparklineClick = (host: string) => {
    setSelectedHost(host);
  };

  /**
   * Handle area chart modal close
   * Closes the modal and clears selected host
   */
  const handleModalClose = () => {
    setSelectedHost(null);
  };

  return (
    <Stack p="md" h="100vh">
      {/* Header with title and time range selector */}
      <Group justify="space-between">
        <Title order={2}>Usage Statistics</Title>
        <Select
          value={timeRange}
          onChange={handleTimeRangeChange}
          data={TIME_RANGE_OPTIONS.map(option => ({
            value: option.value,
            label: option.label,
          }))}
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

      {/* Statistics list */}
      {!loading && !error && (
        <>
          <ScrollArea style={{ flex: 1 }}>
            <Stack gap="md">
              {stats.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">
                  No usage statistics available
                </Text>
              ) : (
                stats.map((stat) => (
                  <StatisticsItem
                    key={stat.host}
                    stat={stat}
                    onClear={() => handleClearHost(stat.host)}
                    onSparklineClick={() => handleSparklineClick(stat.host)}
                  />
                ))
              )}
            </Stack>
          </ScrollArea>

          {/* Clear all button */}
          {stats.length > 0 && (
            <Button
              color="red"
              variant="light"
              onClick={handleClearAllClick}
              fullWidth
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
          timeRange={timeRange}
          onClose={handleModalClose}
        />
      )}
    </Stack>
  );
}
