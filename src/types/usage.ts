/**
 * Usage tracking types for link open statistics
 */

/**
 * Individual usage datapoint representing a single link open event
 */
export interface UsageDatapoint {
  /** Ingress host (e.g., "example.com") */
  host: string;
  /** ISO 8601 timestamp with second precision */
  timestamp: string;
}

/**
 * Time bucket containing aggregated usage count for a time period
 */
export interface TimeBucket {
  /** Start of time bucket (ISO 8601) */
  timestamp: string;
  /** Count of opens in this bucket */
  count: number;
}

/**
 * Aggregated usage statistics for a specific host
 */
export interface AggregatedUsage {
  /** Ingress host */
  host: string;
  /** Total open count across all time */
  totalCount: number;
  /** Time-bucketed counts for sparkline/chart visualization */
  timeBuckets: TimeBucket[];
}

/**
 * Time range selection for statistics aggregation
 */
export type TimeRange = 
  | 'OneHour'      // 1 minute buckets
  | 'TwelveHours'  // 30 minute buckets
  | 'OneDay'       // 1 hour buckets
  | 'ThreeDays'    // 12 hour buckets
  | 'SevenDays'    // 1 day buckets
  | 'ThirtyDays';  // 3 day buckets

/**
 * Time range option for UI selector
 */
export interface TimeRangeOption {
  /** TimeRange enum value */
  value: TimeRange;
  /** Display label for the time range */
  label: string;
  /** Bucket granularity label (e.g., "per minute", "per hour") */
  bucketLabel: string;
}
