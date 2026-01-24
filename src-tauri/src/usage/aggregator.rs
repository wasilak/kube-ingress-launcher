//! Usage aggregation implementation for time-bucketed statistics.

use super::{AggregatedUsage, TimeBucket, TimeRange, UsageDatapoint};
use chrono::{DateTime, Duration, Utc};
use std::collections::HashMap;

/// Aggregates usage datapoints by time range
pub struct UsageAggregator;

impl UsageAggregator {
    /// Aggregate datapoints by time range for all hosts
    pub fn aggregate(
        datapoints: &[UsageDatapoint],
        time_range: TimeRange,
    ) -> Vec<AggregatedUsage> {
        let cutoff_time = Self::get_cutoff_time(time_range);

        // Group by host with pre-allocated capacity estimate
        // Use HashMap for O(1) lookups and efficient grouping
        let mut host_datapoints: HashMap<String, Vec<&UsageDatapoint>> = HashMap::new();
        
        for datapoint in datapoints.iter() {
            // Filter inline to avoid intermediate collection
            if datapoint.timestamp >= cutoff_time {
                host_datapoints
                    .entry(datapoint.host.clone())
                    .or_default()
                    .push(datapoint);
            }
        }

        // Pre-allocate results vector with known capacity
        let mut results: Vec<AggregatedUsage> = Vec::with_capacity(host_datapoints.len());
        
        // Aggregate each host
        for (host, dps) in host_datapoints {
            let total_count = dps.len() as u32;
            let time_buckets = Self::create_time_buckets_with_data(&dps, time_range);

            results.push(AggregatedUsage {
                host,
                total_count,
                time_buckets,
            });
        }

        // Sort by total count descending
        results.sort_unstable_by(|a, b| b.total_count.cmp(&a.total_count));

        results
    }

    /// Aggregate datapoints for a specific host
    pub fn aggregate_host(
        datapoints: &[UsageDatapoint],
        host: &str,
        time_range: TimeRange,
    ) -> AggregatedUsage {
        let cutoff_time = Self::get_cutoff_time(time_range);

        // Filter datapoints for this host within time range
        let filtered: Vec<&UsageDatapoint> = datapoints
            .iter()
            .filter(|dp| dp.host == host && dp.timestamp >= cutoff_time)
            .collect();

        let total_count = filtered.len() as u32;
        let time_buckets = Self::create_time_buckets_with_data(&filtered, time_range);

        AggregatedUsage {
            host: host.to_string(),
            total_count,
            time_buckets,
        }
    }

    /// Get bucket duration for time range
    fn get_bucket_duration(time_range: TimeRange) -> Duration {
        match time_range {
            TimeRange::OneHour => Duration::minutes(1),      // 1 minute buckets
            TimeRange::TwelveHours => Duration::minutes(30), // 30 minute buckets
            TimeRange::OneDay => Duration::hours(1),         // 1 hour buckets
            TimeRange::ThreeDays => Duration::hours(12),     // 12 hour buckets
            TimeRange::SevenDays => Duration::days(1),       // 1 day buckets
            TimeRange::ThirtyDays => Duration::days(1),      // 1 day buckets (changed from 3)
        }
    }

    /// Get cutoff time for time range (how far back to look)
    fn get_cutoff_time(time_range: TimeRange) -> DateTime<Utc> {
        let now = Utc::now();
        match time_range {
            TimeRange::OneHour => now - Duration::hours(1),
            TimeRange::TwelveHours => now - Duration::hours(12),
            TimeRange::OneDay => now - Duration::days(1),
            TimeRange::ThreeDays => now - Duration::days(3),
            TimeRange::SevenDays => now - Duration::days(7),
            TimeRange::ThirtyDays => now - Duration::days(30),
        }
    }

    /// Create time buckets for range (empty buckets)
    fn create_time_buckets(time_range: TimeRange) -> Vec<DateTime<Utc>> {
        let bucket_duration = Self::get_bucket_duration(time_range);
        let cutoff_time = Self::get_cutoff_time(time_range);
        let now = Utc::now();

        // Calculate approximate number of buckets for pre-allocation
        let duration_seconds = (now - cutoff_time).num_seconds();
        let bucket_seconds = bucket_duration.num_seconds();
        let estimated_buckets = (duration_seconds / bucket_seconds) as usize + 2;
        
        let mut buckets = Vec::with_capacity(estimated_buckets);
        let mut current = cutoff_time;

        // Align to bucket boundary
        current = Self::align_to_bucket(current, bucket_duration);

        while current <= now {
            buckets.push(current);
            current += bucket_duration;
        }

        buckets
    }

    /// Create time buckets with data counts
    fn create_time_buckets_with_data(
        datapoints: &[&UsageDatapoint],
        time_range: TimeRange,
    ) -> Vec<TimeBucket> {
        let bucket_duration = Self::get_bucket_duration(time_range);
        let bucket_timestamps = Self::create_time_buckets(time_range);

        // Pre-allocate buckets vector with known capacity
        let mut buckets: Vec<TimeBucket> = Vec::with_capacity(bucket_timestamps.len());
        
        // Initialize buckets with zero counts
        for &timestamp in &bucket_timestamps {
            buckets.push(TimeBucket { timestamp, count: 0 });
        }

        // Count datapoints in each bucket
        for datapoint in datapoints {
            let bucket_index = Self::find_bucket_index(
                datapoint.timestamp,
                &bucket_timestamps,
                bucket_duration,
            );

            if let Some(index) = bucket_index {
                if index < buckets.len() {
                    buckets[index].count += 1;
                }
            }
        }

        buckets
    }

    /// Align timestamp to bucket boundary
    fn align_to_bucket(timestamp: DateTime<Utc>, bucket_duration: Duration) -> DateTime<Utc> {
        let seconds = bucket_duration.num_seconds();
        let ts_seconds = timestamp.timestamp();
        let aligned_seconds = (ts_seconds / seconds) * seconds;

        DateTime::from_timestamp(aligned_seconds, 0).unwrap_or(timestamp)
    }

    /// Find which bucket a timestamp belongs to
    fn find_bucket_index(
        timestamp: DateTime<Utc>,
        buckets: &[DateTime<Utc>],
        bucket_duration: Duration,
    ) -> Option<usize> {
        if buckets.is_empty() {
            return None;
        }

        // Find the bucket this timestamp falls into
        for (i, &bucket_start) in buckets.iter().enumerate() {
            let bucket_end = bucket_start + bucket_duration;
            if timestamp >= bucket_start && timestamp < bucket_end {
                return Some(i);
            }
        }

        // If timestamp is after all buckets, put it in the last bucket
        if timestamp >= buckets[buckets.len() - 1] {
            return Some(buckets.len() - 1);
        }

        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_datapoint(host: &str, minutes_ago: i64) -> UsageDatapoint {
        UsageDatapoint {
            host: host.to_string(),
            timestamp: Utc::now() - Duration::minutes(minutes_ago),
        }
    }

    #[test]
    fn test_aggregate_empty_datapoints() {
        let datapoints: Vec<UsageDatapoint> = vec![];
        let result = UsageAggregator::aggregate(&datapoints, TimeRange::OneHour);
        assert_eq!(result.len(), 0);
    }

    #[test]
    fn test_aggregate_single_host() {
        let datapoints = vec![
            create_datapoint("example.com", 10),
            create_datapoint("example.com", 20),
            create_datapoint("example.com", 30),
        ];

        let result = UsageAggregator::aggregate(&datapoints, TimeRange::OneHour);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].host, "example.com");
        assert_eq!(result[0].total_count, 3);
    }

    #[test]
    fn test_aggregate_multiple_hosts() {
        let datapoints = vec![
            create_datapoint("host1.com", 10),
            create_datapoint("host2.com", 15),
            create_datapoint("host1.com", 20),
        ];

        let result = UsageAggregator::aggregate(&datapoints, TimeRange::OneHour);
        assert_eq!(result.len(), 2);

        // Should be sorted by count descending
        assert_eq!(result[0].host, "host1.com");
        assert_eq!(result[0].total_count, 2);
        assert_eq!(result[1].host, "host2.com");
        assert_eq!(result[1].total_count, 1);
    }

    #[test]
    fn test_aggregate_filters_old_datapoints() {
        let datapoints = vec![
            create_datapoint("example.com", 30),  // Within 1 hour
            create_datapoint("example.com", 90),  // Outside 1 hour
        ];

        let result = UsageAggregator::aggregate(&datapoints, TimeRange::OneHour);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].total_count, 1); // Only the recent one
    }

    #[test]
    fn test_aggregate_host_specific() {
        let datapoints = vec![
            create_datapoint("host1.com", 10),
            create_datapoint("host2.com", 15),
            create_datapoint("host1.com", 20),
        ];

        let result = UsageAggregator::aggregate_host(&datapoints, "host1.com", TimeRange::OneHour);
        assert_eq!(result.host, "host1.com");
        assert_eq!(result.total_count, 2);
    }

    #[test]
    fn test_aggregate_host_not_found() {
        let datapoints = vec![
            create_datapoint("host1.com", 10),
        ];

        let result = UsageAggregator::aggregate_host(&datapoints, "host2.com", TimeRange::OneHour);
        assert_eq!(result.host, "host2.com");
        assert_eq!(result.total_count, 0);
    }

    #[test]
    fn test_get_bucket_duration() {
        assert_eq!(
            UsageAggregator::get_bucket_duration(TimeRange::OneHour),
            Duration::minutes(1)
        );
        assert_eq!(
            UsageAggregator::get_bucket_duration(TimeRange::TwelveHours),
            Duration::minutes(30)
        );
        assert_eq!(
            UsageAggregator::get_bucket_duration(TimeRange::OneDay),
            Duration::hours(1)
        );
        assert_eq!(
            UsageAggregator::get_bucket_duration(TimeRange::ThreeDays),
            Duration::hours(12)
        );
        assert_eq!(
            UsageAggregator::get_bucket_duration(TimeRange::SevenDays),
            Duration::days(1)
        );
        assert_eq!(
            UsageAggregator::get_bucket_duration(TimeRange::ThirtyDays),
            Duration::days(1)
        );
    }

    #[test]
    fn test_create_time_buckets_one_hour() {
        let buckets = UsageAggregator::create_time_buckets(TimeRange::OneHour);
        
        // Should have approximately 60 buckets (1 per minute for 1 hour)
        assert!(buckets.len() >= 59 && buckets.len() <= 61);
    }

    #[test]
    fn test_time_buckets_have_counts() {
        let datapoints = vec![
            create_datapoint("example.com", 5),
            create_datapoint("example.com", 10),
            create_datapoint("example.com", 15),
        ];

        let result = UsageAggregator::aggregate(&datapoints, TimeRange::OneHour);
        assert_eq!(result.len(), 1);

        let buckets = &result[0].time_buckets;
        
        // Should have buckets
        assert!(!buckets.is_empty());

        // Total count across buckets should equal total_count
        let bucket_sum: u32 = buckets.iter().map(|b| b.count).sum();
        assert_eq!(bucket_sum, result[0].total_count);
    }

    #[test]
    fn test_align_to_bucket() {
        let timestamp = DateTime::from_timestamp(1234567, 0).unwrap();
        let bucket_duration = Duration::minutes(1);
        
        let aligned = UsageAggregator::align_to_bucket(timestamp, bucket_duration);
        
        // Should be aligned to minute boundary
        assert_eq!(aligned.timestamp() % 60, 0);
    }
}
