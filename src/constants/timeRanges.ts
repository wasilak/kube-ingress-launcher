/**
 * Time range constants for usage statistics
 * 
 * This module defines the available time range options for filtering
 * usage statistics in the statistics view.
 * 
 * Requirements: 7.1, 7.2
 */

import type { TimeRangeOption } from '../types/usage';

/**
 * Available time range options for statistics filtering
 * 
 * Each option includes:
 * - value: TimeRange enum value for backend aggregation
 * - label: User-friendly display label
 * - bucketLabel: Description of aggregation granularity
 * 
 * Time ranges and their bucket sizes:
 * - 1 hour: 60 buckets of 1 minute each
 * - 12 hours: 24 buckets of 30 minutes each
 * - 24 hours: 24 buckets of 1 hour each
 * - 3 days: 6 buckets of 12 hours each
 * - 7 days: 7 buckets of 1 day each
 * - 30 days: 10 buckets of 3 days each
 * 
 * Requirements: 7.1, 7.2
 */
export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  {
    value: 'OneHour',
    label: '1 hour',
    bucketLabel: 'per minute',
  },
  {
    value: 'TwelveHours',
    label: '12 hours',
    bucketLabel: 'per 30 minutes',
  },
  {
    value: 'OneDay',
    label: '24 hours',
    bucketLabel: 'per hour',
  },
  {
    value: 'ThreeDays',
    label: '3 days',
    bucketLabel: 'per 12 hours',
  },
  {
    value: 'SevenDays',
    label: '7 days',
    bucketLabel: 'per day',
  },
  {
    value: 'ThirtyDays',
    label: '30 days',
    bucketLabel: 'per 3 days',
  },
];

/**
 * Default time range for statistics view
 * 
 * Requirements: 7.10
 */
export const DEFAULT_TIME_RANGE = 'SevenDays';
