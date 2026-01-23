use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Individual open event record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageDatapoint {
    /// Ingress host (e.g., "example.com")
    pub host: String,
    /// ISO 8601 timestamp with second precision
    pub timestamp: DateTime<Utc>,
}

/// Collection of all datapoints
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageStats {
    /// All recorded datapoints
    pub datapoints: Vec<UsageDatapoint>,
}

impl UsageStats {
    /// Create new empty usage stats
    pub fn new() -> Self {
        Self {
            datapoints: Vec::new(),
        }
    }
}

impl Default for UsageStats {
    fn default() -> Self {
        Self::new()
    }
}

/// Time-bucketed count for sparkline/chart
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeBucket {
    /// Start of time bucket (ISO 8601)
    pub timestamp: DateTime<Utc>,
    /// Count of opens in this bucket
    pub count: u32,
}

/// Aggregated usage for display
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregatedUsage {
    /// Ingress host
    pub host: String,
    /// Total open count
    pub total_count: u32,
    /// Time-bucketed counts for sparkline/chart
    pub time_buckets: Vec<TimeBucket>,
}

/// Time range selection for aggregation
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum TimeRange {
    /// 1 hour with 1-minute buckets
    OneHour,
    /// 12 hours with 30-minute buckets
    TwelveHours,
    /// 24 hours with 1-hour buckets
    OneDay,
    /// 3 days with 12-hour buckets
    ThreeDays,
    /// 7 days with 1-day buckets
    SevenDays,
    /// 30 days with 3-day buckets
    ThirtyDays,
}
