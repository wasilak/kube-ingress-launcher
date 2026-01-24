import { Modal, Stack, Text, Loader, ScrollArea } from '@mantine/core';
import { AreaChart } from '@mantine/charts';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { AggregatedUsage, TimeRange } from '../types/usage';

/**
 * Props for the AreaChartModal component
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
interface AreaChartModalProps {
  /** Ingress host to display usage for */
  host: string;
  
  /** Time range for aggregation */
  timeRange: TimeRange;
  
  /** Callback when the modal should close */
  onClose: () => void;
}

/**
 * AreaChartModal component displays detailed usage statistics in an area chart
 * 
 * Features:
 * - Fetches host-specific usage data via get_host_usage command
 * - Displays loading state while fetching
 * - Shows detailed area chart with time-bucketed usage data
 * - Displays host name in modal title
 * - Shows total open count above chart
 * - Uses Mantine AreaChart with linear curve and filled area
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
export function AreaChartModal({
  host,
  timeRange,
  onClose,
}: AreaChartModalProps) {
  const [data, setData] = useState<AggregatedUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHostData();
  }, [host, timeRange]);

  /**
   * Load usage data for the specific host
   * Fetches aggregated usage via get_host_usage command
   */
  const loadHostData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<AggregatedUsage>('get_host_usage', {
        host,
        timeRange,
      });
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to load host usage:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Transform time buckets to chart data format
   * Converts ISO 8601 timestamps to readable format
   */
  const chartData = data?.timeBuckets.map(bucket => ({
    timestamp: new Date(bucket.timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    count: bucket.count,
  })) || [];

  /**
   * Value formatter for chart tooltips
   * Formats count as "X opens" or "X open"
   */
  const valueFormatter = (value: number) => {
    return `${value} ${value === 1 ? 'open' : 'opens'}`;
  };

  return (
    <Modal
      opened={true}
      onClose={onClose}
      size="lg"
      title={`Usage Details: ${host}`}
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader />
          </div>
        )}

        {error && (
          <Text c="red" size="sm">
            Failed to load usage data: {error}
          </Text>
        )}

        {!loading && !error && data && (
          <>
            <Text size="sm" c="dimmed">
              Total opens: {data.totalCount}
            </Text>

            <div style={{ maxHeight: '300px', height: 'min(300px, 50vh)' }}>
              <AreaChart
                h="100%"
                data={chartData}
                dataKey="timestamp"
                series={[
                  { 
                    name: 'count', 
                    color: 'blue.6', 
                    label: 'Opens' 
                  }
                ]}
                fillOpacity={0.3}
                strokeWidth={2}
                curveType="linear"
                withLegend
                valueFormatter={valueFormatter}
              />
            </div>
          </>
        )}
      </Stack>
    </Modal>
  );
}
