import { Paper, Group, Text, Button } from '@mantine/core';
import { Sparkline } from '@mantine/charts';
import { AggregatedUsage } from '../types/usage';
import { memo, useMemo } from 'react';

/**
 * Props for the StatisticsItem component
 * 
 * Requirements: 4.4, 5.1, 5.2, 8.1
 */
interface StatisticsItemProps {
  /** Aggregated usage statistics for a specific host */
  stat: AggregatedUsage;
  
  /** Callback when the clear button is clicked */
  onClear: () => void;
  
  /** Callback when the sparkline is clicked to show detailed chart */
  onSparklineClick: () => void;
}

/**
 * StatisticsItem component displays usage statistics for a single ingress host
 * 
 * Features:
 * - Displays host name and total open count
 * - Shows sparkline visualization of usage over time
 * - Provides clear button to remove statistics for this host
 * - Clickable sparkline opens detailed area chart modal
 * 
 * Optimizations:
 * - Memoized with React.memo to prevent unnecessary re-renders
 * - Sparkline data extraction memoized with useMemo
 * 
 * Requirements: 4.4, 5.1, 5.2, 8.1, 13.2
 */
export const StatisticsItem = memo(function StatisticsItem({
  stat,
  onClear,
  onSparklineClick,
}: StatisticsItemProps) {
  // Memoize sparkline data extraction to avoid recalculation on every render
  const sparklineData = useMemo(
    () => stat.timeBuckets.map(bucket => bucket.count),
    [stat.timeBuckets]
  );

  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" mb="xs">
        <div>
          <Text fw={500}>{stat.host}</Text>
          <Text size="sm" c="dimmed">
            {stat.totalCount} {stat.totalCount === 1 ? 'open' : 'opens'}
          </Text>
        </div>
        <Button
          size="xs"
          variant="light"
          color="red"
          onClick={onClear}
        >
          Clear
        </Button>
      </Group>

      <div
        onClick={onSparklineClick}
        style={{ cursor: 'pointer' }}
      >
        <Sparkline
          w="100%"
          h={60}
          data={sparklineData}
          curveType="linear"
          color="blue"
          fillOpacity={0.6}
          strokeWidth={2}
        />
      </div>
    </Paper>
  );
});
