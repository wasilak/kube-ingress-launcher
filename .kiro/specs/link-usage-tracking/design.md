# Design Document: Link Usage Tracking and Statistics

## Overview

This design document describes the implementation of link usage tracking and statistics visualization for the kube-ingress-desktop application. The feature tracks how many times users open ingress links, displays usage counts in the search interface, and provides a dedicated statistics view with sparkline and area chart visualizations.

The implementation follows the existing Tauri v2 architecture with a Rust backend for data management and persistence, and a React frontend for UI components and visualizations. Usage data is stored persistently using tauri-plugin-store and cleaned up automatically to prevent unbounded growth.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend                           │
│  ┌──────────────────┐  ┌──────────────────────────────────┐│
│  │  Search Window   │  │    Statistics Window             ││
│  │  - Usage Badges  │  │    - Top 10 List                 ││
│  │  - Top 10 Sort   │  │    - Sparklines                  ││
│  │                  │  │    - Area Chart Modal            ││
│  │                  │  │    - Time Selector               ││
│  └──────────────────┘  └──────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            │ IPC (invoke/emit)
┌─────────────────────────────────────────────────────────────┐
│                    Rust Backend                             │
│  ┌──────────────────────────────────────────────────────────┐
│  │  Usage Tracking Module                                   │
│  │  - Record open events                                    │
│  │  - Aggregate datapoints by time range                    │
│  │  - Cleanup old datapoints (>30 days)                     │
│  │  - Persist to tauri-plugin-store                         │
│  └──────────────────────────────────────────────────────────┘
│  ┌──────────────────────────────────────────────────────────┐
│  │  AppState (Extended)                                     │
│  │  - usage_stats: Arc<RwLock<UsageStats>>                  │
│  └──────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Persistent    │
                    │ Storage       │
                    │ (JSON file)   │
                    └───────────────┘
```

### Data Flow

1. **Recording Opens**: User clicks link → Frontend calls `record_link_open` command → Backend records datapoint with timestamp → Persists to storage → Emits update event
2. **Displaying Badges**: Frontend loads usage stats → Aggregates by host → Displays count badges
3. **Statistics View**: User opens statistics → Frontend calls `get_usage_stats` command → Backend aggregates by time range → Frontend renders sparklines and charts
4. **Cleanup**: Refresh task runs → Backend removes datapoints >30 days → Updates statistics → Emits update event

## Components and Interfaces

### Backend Components

#### 1. Data Models

**UsageDatapoint** - Individual open event record
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageDatapoint {
    /// Ingress host (e.g., "example.com")
    pub host: String,
    /// ISO 8601 timestamp with second precision
    pub timestamp: DateTime<Utc>,
}
```

**UsageStats** - Collection of all datapoints
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageStats {
    /// All recorded datapoints
    pub datapoints: Vec<UsageDatapoint>,
}
```

**AggregatedUsage** - Aggregated usage for display
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregatedUsage {
    /// Ingress host
    pub host: String,
    /// Total open count
    pub total_count: u32,
    /// Time-bucketed counts for sparkline/chart
    pub time_buckets: Vec<TimeBucket>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeBucket {
    /// Start of time bucket (ISO 8601)
    pub timestamp: DateTime<Utc>,
    /// Count of opens in this bucket
    pub count: u32,
}
```

**TimeRange** - Time range selection
```rust
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum TimeRange {
    OneHour,      // 1 minute buckets
    TwelveHours,  // 30 minute buckets
    OneDay,       // 1 hour buckets
    ThreeDays,    // 12 hour buckets
    SevenDays,    // 1 day buckets
    ThirtyDays,   // 3 day buckets
}
```

#### 2. Usage Tracking Module

**Location**: `src-tauri/src/usage/mod.rs`, `src-tauri/src/usage/tracker.rs`, `src-tauri/src/usage/aggregator.rs`

**UsageTracker** - Manages usage tracking operations
```rust
pub struct UsageTracker {
    stats: Arc<RwLock<UsageStats>>,
    store_path: PathBuf,
}

impl UsageTracker {
    /// Create new tracker and load from storage
    pub async fn new(app_handle: &AppHandle) -> Result<Self, AppError>;
    
    /// Record a link open event
    pub async fn record_open(&self, host: String) -> Result<(), AppError>;
    
    /// Get aggregated usage for a time range
    pub async fn get_aggregated(
        &self,
        time_range: TimeRange,
    ) -> Result<Vec<AggregatedUsage>, AppError>;
    
    /// Get aggregated usage for a specific host
    pub async fn get_host_aggregated(
        &self,
        host: String,
        time_range: TimeRange,
    ) -> Result<AggregatedUsage, AppError>;
    
    /// Clear all datapoints for a specific host
    pub async fn clear_host(&self, host: String) -> Result<(), AppError>;
    
    /// Clear all datapoints
    pub async fn clear_all(&self) -> Result<(), AppError>;
    
    /// Remove datapoints older than 30 days
    pub async fn cleanup_old_datapoints(&self) -> Result<usize, AppError>;
    
    /// Persist to storage
    async fn save(&self) -> Result<(), AppError>;
    
    /// Load from storage
    async fn load(app_handle: &AppHandle) -> Result<UsageStats, AppError>;
}
```

**UsageAggregator** - Aggregates datapoints by time range
```rust
pub struct UsageAggregator;

impl UsageAggregator {
    /// Aggregate datapoints by time range
    pub fn aggregate(
        datapoints: &[UsageDatapoint],
        time_range: TimeRange,
    ) -> Vec<AggregatedUsage>;
    
    /// Aggregate datapoints for a specific host
    pub fn aggregate_host(
        datapoints: &[UsageDatapoint],
        host: &str,
        time_range: TimeRange,
    ) -> AggregatedUsage;
    
    /// Get bucket duration for time range
    fn get_bucket_duration(time_range: TimeRange) -> Duration;
    
    /// Get cutoff time for time range
    fn get_cutoff_time(time_range: TimeRange) -> DateTime<Utc>;
    
    /// Create time buckets for range
    fn create_time_buckets(
        time_range: TimeRange,
    ) -> Vec<DateTime<Utc>>;
}
```

#### 3. Tauri Commands

**Location**: `src-tauri/src/commands/usage.rs`

```rust
/// Record a link open event
#[tauri::command]
pub async fn record_link_open(
    host: String,
    state: State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<(), String>;

/// Get aggregated usage statistics
#[tauri::command]
pub async fn get_usage_stats(
    time_range: TimeRange,
    state: State<'_, AppState>,
) -> Result<Vec<AggregatedUsage>, String>;

/// Get aggregated usage for a specific host
#[tauri::command]
pub async fn get_host_usage(
    host: String,
    time_range: TimeRange,
    state: State<'_, AppState>,
) -> Result<AggregatedUsage, String>;

/// Clear usage statistics for a specific host
#[tauri::command]
pub async fn clear_host_usage(
    host: String,
    state: State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<(), String>;

/// Clear all usage statistics
#[tauri::command]
pub async fn clear_all_usage(
    state: State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<(), String>;

/// Get usage count for a specific host
#[tauri::command]
pub async fn get_host_count(
    host: String,
    state: State<'_, AppState>,
) -> Result<u32, String>;

/// Get usage counts for all hosts
#[tauri::command]
pub async fn get_all_counts(
    state: State<'_, AppState>,
) -> Result<HashMap<String, u32>, String>;
```

#### 4. AppState Extension

**Location**: `src-tauri/src/state/app_state.rs`

```rust
#[derive(Clone)]
pub struct AppState {
    // Existing fields
    pub ingresses: Arc<RwLock<Vec<IngressData>>>,
    pub last_error: Arc<RwLock<Option<ErrorInfo>>>,
    pub last_updated: Arc<RwLock<Option<DateTime<Utc>>>>,
    
    // New field for usage tracking
    pub usage_tracker: Arc<UsageTracker>,
}
```

#### 5. Refresh Task Integration

**Location**: `src-tauri/src/refresh/task.rs`

Extend the existing refresh task to cleanup old datapoints:

```rust
pub async fn start_refresh_task(app_handle: AppHandle) {
    // ... existing code ...
    
    loop {
        interval.tick().await;
        
        // Cleanup old usage datapoints before refresh
        if let Err(e) = cleanup_usage_datapoints(&app_handle).await {
            eprintln!("Failed to cleanup usage datapoints: {}", e);
        }
        
        // ... existing refresh logic ...
    }
}

async fn cleanup_usage_datapoints(app_handle: &AppHandle) -> Result<(), AppError> {
    let state = app_handle.state::<AppState>();
    let removed = state.usage_tracker.cleanup_old_datapoints().await?;
    
    if removed > 0 {
        println!("Cleaned up {} old usage datapoints", removed);
        // Emit update event
        let _ = app_handle.emit("usage-stats-updated", ());
    }
    
    Ok(())
}
```

### Frontend Components

#### 1. TypeScript Types

**Location**: `src/types/usage.ts`

```typescript
export interface UsageDatapoint {
  host: string;
  timestamp: string; // ISO 8601
}

export interface TimeBucket {
  timestamp: string; // ISO 8601
  count: number;
}

export interface AggregatedUsage {
  host: string;
  totalCount: number;
  timeBuckets: TimeBucket[];
}

export type TimeRange = 
  | 'OneHour' 
  | 'TwelveHours' 
  | 'OneDay' 
  | 'ThreeDays' 
  | 'SevenDays' 
  | 'ThirtyDays';

export interface TimeRangeOption {
  value: TimeRange;
  label: string;
  bucketLabel: string; // e.g., "per minute", "per hour"
}
```

#### 2. Custom Hooks

**useUsageStats** - Manages usage statistics state
```typescript
// Location: src/hooks/useUsageStats.ts
export function useUsageStats(timeRange: TimeRange) {
  const [stats, setStats] = useState<AggregatedUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    
    // Listen for updates
    const unlisten = listen('usage-stats-updated', () => {
      loadStats();
    });
    
    return () => { unlisten.then(fn => fn()); };
  }, [timeRange]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const result = await invoke<AggregatedUsage[]>(
        'get_usage_stats',
        { timeRange }
      );
      setStats(result);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const clearHost = async (host: string) => {
    await invoke('clear_host_usage', { host });
  };

  const clearAll = async () => {
    await invoke('clear_all_usage');
  };

  return { stats, loading, error, clearHost, clearAll, refresh: loadStats };
}
```

**useUsageCounts** - Manages usage count badges
```typescript
// Location: src/hooks/useUsageCounts.ts
export function useUsageCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadCounts();
    
    // Listen for updates
    const unlisten = listen('usage-stats-updated', () => {
      loadCounts();
    });
    
    return () => { unlisten.then(fn => fn()); };
  }, []);

  const loadCounts = async () => {
    try {
      const result = await invoke<Record<string, number>>('get_all_counts');
      setCounts(result);
    } catch (err) {
      console.error('Failed to load usage counts:', err);
    }
  };

  const recordOpen = async (host: string) => {
    try {
      await invoke('record_link_open', { host });
      // Optimistically update local state
      setCounts(prev => ({
        ...prev,
        [host]: (prev[host] || 0) + 1,
      }));
    } catch (err) {
      console.error('Failed to record link open:', err);
    }
  };

  return { counts, recordOpen };
}
```

#### 3. UI Components

**UsageBadge** - Displays usage count badge
```typescript
// Location: src/components/UsageBadge.tsx
interface UsageBadgeProps {
  count: number;
}

export function UsageBadge({ count }: UsageBadgeProps) {
  return (
    <Badge
      size="sm"
      variant="light"
      color={count > 0 ? 'blue' : 'gray'}
      style={{ marginLeft: 'auto' }}
    >
      {count}
    </Badge>
  );
}
```

**StatisticsView** - Main statistics window
```typescript
// Location: src/components/StatisticsView.tsx
export function StatisticsView() {
  const [timeRange, setTimeRange] = useState<TimeRange>('SevenDays');
  const { stats, loading, error, clearHost, clearAll } = useUsageStats(timeRange);
  const [selectedHost, setSelectedHost] = useState<string | null>(null);

  return (
    <Stack p="md" h="100vh">
      <Group justify="space-between">
        <Title order={2}>Usage Statistics</Title>
        <Select
          value={timeRange}
          onChange={(value) => setTimeRange(value as TimeRange)}
          data={TIME_RANGE_OPTIONS}
        />
      </Group>

      {loading && <Loader />}
      {error && <Alert color="red">{error}</Alert>}

      <ScrollArea style={{ flex: 1 }}>
        <Stack gap="md">
          {stats.map((stat) => (
            <StatisticsItem
              key={stat.host}
              stat={stat}
              timeRange={timeRange}
              onClear={() => clearHost(stat.host)}
              onSparklineClick={() => setSelectedHost(stat.host)}
            />
          ))}
        </Stack>
      </ScrollArea>

      <Button
        color="red"
        variant="light"
        onClick={handleClearAll}
      >
        Clear All Statistics
      </Button>

      {selectedHost && (
        <AreaChartModal
          host={selectedHost}
          timeRange={timeRange}
          onClose={() => setSelectedHost(null)}
        />
      )}
    </Stack>
  );
}
```

**StatisticsItem** - Individual statistics entry
```typescript
// Location: src/components/StatisticsItem.tsx
interface StatisticsItemProps {
  stat: AggregatedUsage;
  timeRange: TimeRange;
  onClear: () => void;
  onSparklineClick: () => void;
}

export function StatisticsItem({
  stat,
  timeRange,
  onClear,
  onSparklineClick,
}: StatisticsItemProps) {
  const sparklineData = stat.timeBuckets.map(b => b.count);

  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" mb="xs">
        <div>
          <Text fw={500}>{stat.host}</Text>
          <Text size="sm" c="dimmed">
            {stat.totalCount} opens
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
}
```

**AreaChartModal** - Detailed area chart modal
```typescript
// Location: src/components/AreaChartModal.tsx
interface AreaChartModalProps {
  host: string;
  timeRange: TimeRange;
  onClose: () => void;
}

export function AreaChartModal({
  host,
  timeRange,
  onClose,
}: AreaChartModalProps) {
  const [data, setData] = useState<AggregatedUsage | null>(null);

  useEffect(() => {
    loadHostData();
  }, [host, timeRange]);

  const loadHostData = async () => {
    const result = await invoke<AggregatedUsage>(
      'get_host_usage',
      { host, timeRange }
    );
    setData(result);
  };

  if (!data) return <Loader />;

  const chartData = data.timeBuckets.map(bucket => ({
    timestamp: new Date(bucket.timestamp).toLocaleString(),
    count: bucket.count,
  }));

  return (
    <Modal
      opened={true}
      onClose={onClose}
      size="xl"
      title={`Usage Details: ${host}`}
    >
      <Stack>
        <Text size="sm" c="dimmed">
          Total opens: {data.totalCount}
        </Text>

        <AreaChart
          h={400}
          data={chartData}
          dataKey="timestamp"
          series={[{ name: 'count', color: 'blue.6', label: 'Opens' }]}
          fillOpacity={0.3}
          strokeWidth={2}
          curveType="linear"
          withLegend
          valueFormatter={(value) => `${value} opens`}
        />
      </Stack>
    </Modal>
  );
}
```

#### 4. Integration with Existing Components

**IngressItem** - Add usage badge and record opens
```typescript
// Location: src/components/IngressItem.tsx (modifications)
export function IngressItem({ ingress, onSelect }: IngressItemProps) {
  const { counts, recordOpen } = useUsageCounts();
  
  const handleUrlClick = async (url: string, host: string) => {
    await recordOpen(host);
    await invoke('open_url', { url });
  };

  return (
    <Paper>
      <Group justify="space-between">
        <div>
          {/* Existing content */}
        </div>
        <UsageBadge count={counts[ingress.hosts[0]] || 0} />
      </Group>
      {/* Rest of component */}
    </Paper>
  );
}
```

**IngressList** - Sort by usage when search is empty
```typescript
// Location: src/components/IngressList.tsx (modifications)
export function IngressList({ ingresses, searchTerm }: IngressListProps) {
  const { counts } = useUsageCounts();

  const sortedIngresses = useMemo(() => {
    if (searchTerm) {
      // Return filtered results in current order
      return ingresses;
    }

    // Sort by usage count (descending)
    const sorted = [...ingresses].sort((a, b) => {
      const countA = counts[a.hosts[0]] || 0;
      const countB = counts[b.hosts[0]] || 0;
      return countB - countA;
    });

    // Top 10 + rest
    const top10 = sorted.slice(0, 10);
    const rest = sorted.slice(10);

    return [...top10, ...rest];
  }, [ingresses, searchTerm, counts]);

  return (
    <Stack>
      {sortedIngresses.map((ingress) => (
        <IngressItem key={ingress.id} ingress={ingress} />
      ))}
    </Stack>
  );
}
```

## Data Models

### Storage Schema

Usage statistics are stored in a JSON file using tauri-plugin-store:

**File**: `usage_stats.json`

```json
{
  "datapoints": [
    {
      "host": "example.com",
      "timestamp": "2024-01-15T14:30:25Z"
    },
    {
      "host": "api.example.com",
      "timestamp": "2024-01-15T14:35:10Z"
    },
    {
      "host": "example.com",
      "timestamp": "2024-01-15T15:20:45Z"
    }
  ]
}
```

### Aggregation Logic

Datapoints are aggregated on-demand based on the selected time range:

1. **Filter by time range**: Only include datapoints within the selected time range
2. **Group by host**: Group datapoints by ingress host
3. **Create time buckets**: Create buckets based on time range granularity
4. **Count per bucket**: Count datapoints in each bucket
5. **Fill gaps**: Ensure all buckets exist (with 0 count if no data)

**Time Range Configurations**:
- 1 hour: 60 buckets of 1 minute each
- 12 hours: 24 buckets of 30 minutes each
- 24 hours: 24 buckets of 1 hour each
- 3 days: 6 buckets of 12 hours each
- 7 days: 7 buckets of 1 day each
- 30 days: 10 buckets of 3 days each


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:

**Redundant Properties Eliminated**:
1. Properties 3.1 and 4.3 both test "top 10 sorted by count descending" - combined into Property 3
2. Properties 5.4 and 7.9 both test "UI updates when time range changes" - combined into Property 7
3. Properties 8.3, 8.4, 8.5 all test "UI updates after clearing" - combined into Property 10
4. Properties 9.6 and 9.7 both test "UI updates after clearing all" - combined into Property 11
5. Properties 11.1 and 11.3 both test "no pre-aggregation" - combined into Property 13

**Properties Combined for Comprehensiveness**:
1. Properties 2.2 and 2.5 combined into Property 2 (badge shows correct count and updates)
2. Properties 7.3-7.8 combined into Property 6 (all time range aggregations)

### Core Properties

**Property 1: Link Open Recording**
*For any* ingress host and timestamp, when a link open is recorded, the system should store a datapoint with that host and a second-precision timestamp, and the datapoint should be persisted to storage.
**Validates: Requirements 1.1, 1.2, 1.3**

**Property 2: Usage Count Accuracy**
*For any* ingress host with N recorded opens, the usage count badge should display N, and after recording a new open, the badge should display N+1.
**Validates: Requirements 2.2, 2.5**

**Property 3: Top 10 Sorting**
*For any* set of ingresses with usage counts, when the search input is empty, the top 10 ingresses by open count should appear first in descending order, followed by all other ingresses in their original order.
**Validates: Requirements 3.1, 3.2, 3.3, 4.3**

**Property 4: Search Filtering Preserves Order**
*For any* non-empty search term, filtered ingress results should maintain their original order without usage-based prioritization.
**Validates: Requirements 3.4**

**Property 5: Host Key Extraction**
*For any* URL with the same host but different paths, the system should extract and use the host as the tracking key, aggregating opens across all paths.
**Validates: Requirements 1.5**

**Property 6: Time Range Aggregation**
*For any* time range selection, the system should aggregate datapoints into buckets matching the specified granularity: 1 hour → 1-minute buckets, 12 hours → 30-minute buckets, 24 hours → 1-hour buckets, 3 days → 12-hour buckets, 7 days → 1-day buckets, 30 days → 3-day buckets.
**Validates: Requirements 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 5.3**

**Property 7: Sparkline Data Consistency**
*For any* time range selection, all sparklines should visualize usage data aggregated according to that time range, and when the time range changes, all sparklines should update to reflect the new aggregation.
**Validates: Requirements 5.2, 5.4, 7.9**

**Property 8: Area Chart Consistency**
*For any* host and time range, the area chart modal should display the same aggregated data as the corresponding sparkline.
**Validates: Requirements 6.2, 6.3**

**Property 9: Host Clearing**
*For any* ingress host with recorded datapoints, after clearing that host's statistics, no datapoints for that host should exist in storage.
**Validates: Requirements 8.2**

**Property 10: Clear Host Reactivity**
*For any* host that is cleared, the statistics view, usage count badges, and top 10 list should all update immediately to reflect the removal.
**Validates: Requirements 8.3, 8.4, 8.5**

**Property 11: Clear All Reactivity**
*For any* state with recorded datapoints, after clearing all statistics, all datapoints should be removed, all badges should show 0, and the statistics view should be empty.
**Validates: Requirements 9.4, 9.6, 9.7**

**Property 12: Datapoint Cleanup**
*For any* set of datapoints, after cleanup runs, all datapoints with timestamps older than 30 days should be removed, and all datapoints within 30 days should remain.
**Validates: Requirements 10.2**

**Property 13: No Pre-Aggregation**
*For any* recorded open event, the system should store it as a separate datapoint without pre-aggregation, and aggregation should only occur on-demand when displaying statistics.
**Validates: Requirements 11.1, 11.3, 11.4**

**Property 14: Datapoint Structure**
*For any* stored datapoint, it should contain exactly two fields: host (string) and timestamp (ISO 8601 with second precision).
**Validates: Requirements 11.2**

**Property 15: Storage Round Trip**
*For any* valid set of datapoints, saving to storage then loading should produce an equivalent set of datapoints.
**Validates: Requirements 1.3, 1.4**

**Property 16: Window State Persistence**
*For any* statistics window size and position, after closing and reopening the window, the size and position should be restored.
**Validates: Requirements 12.4**

**Property 17: Error Resilience**
*For any* storage operation failure (read or write), the system should log the error and continue operation without crashing.
**Validates: Requirements 14.1, 14.2, 14.3**

**Property 18: Universal Tracking**
*For any* ingress link open, regardless of how it was accessed (search results, top 10, etc.), the system should record a datapoint.
**Validates: Requirements 15.1**

**Property 19: Historical Data Retention**
*For any* ingress host with recorded statistics, even if the ingress is removed from Kubernetes, the statistics should be retained and displayed in the statistics view.
**Validates: Requirements 15.4, 15.5**

## Error Handling

### Error Types

The usage tracking feature introduces new error scenarios that must be handled gracefully:

**Storage Errors**:
- File not found when loading statistics
- Permission denied when writing to storage
- Corrupted JSON data in storage file
- Disk full when persisting datapoints

**Data Errors**:
- Invalid timestamp format in datapoints
- Missing required fields in datapoints
- Datapoints with future timestamps
- Extremely large number of datapoints (>100k)

**UI Errors**:
- Failed to render sparkline chart
- Failed to render area chart
- Failed to open statistics window
- Failed to emit update events

### Error Handling Strategy

**Storage Errors**:
```rust
// Graceful degradation on load failure
pub async fn load(app_handle: &AppHandle) -> Result<UsageStats, AppError> {
    match load_from_store(app_handle).await {
        Ok(stats) => Ok(stats),
        Err(e) => {
            eprintln!("Failed to load usage stats: {}. Starting with empty stats.", e);
            Ok(UsageStats { datapoints: Vec::new() })
        }
    }
}

// Log and continue on save failure
async fn save(&self) -> Result<(), AppError> {
    if let Err(e) = save_to_store(&self.stats).await {
        eprintln!("Failed to save usage stats: {}. Data may be lost.", e);
        return Err(e);
    }
    Ok(())
}
```

**Data Validation**:
```rust
// Validate datapoints before storing
fn validate_datapoint(datapoint: &UsageDatapoint) -> Result<(), AppError> {
    // Check timestamp is not in the future
    if datapoint.timestamp > Utc::now() {
        return Err(AppError::InvalidDatapoint(
            "Timestamp cannot be in the future".to_string()
        ));
    }
    
    // Check host is not empty
    if datapoint.host.is_empty() {
        return Err(AppError::InvalidDatapoint(
            "Host cannot be empty".to_string()
        ));
    }
    
    Ok(())
}
```

**UI Error Handling**:
```typescript
// Display error in statistics view
export function StatisticsView() {
  const { stats, loading, error } = useUsageStats(timeRange);

  if (error) {
    return (
      <Alert color="red" title="Failed to Load Statistics">
        {error}
        <Button onClick={retry}>Retry</Button>
      </Alert>
    );
  }

  // ... rest of component
}
```

**Cleanup Error Handling**:
```rust
// Continue refresh even if cleanup fails
async fn cleanup_usage_datapoints(app_handle: &AppHandle) -> Result<(), AppError> {
    let state = app_handle.state::<AppState>();
    
    match state.usage_tracker.cleanup_old_datapoints().await {
        Ok(removed) => {
            if removed > 0 {
                println!("Cleaned up {} old usage datapoints", removed);
            }
            Ok(())
        }
        Err(e) => {
            eprintln!("Failed to cleanup usage datapoints: {}. Continuing with refresh.", e);
            // Don't propagate error - continue with refresh
            Ok(())
        }
    }
}
```

## Testing Strategy

### Dual Testing Approach

The usage tracking feature requires both unit tests and property-based tests:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
**Property Tests**: Verify universal properties across all inputs

Together, these provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Backend Testing (Rust)

#### Unit Tests

**Location**: `src-tauri/src/usage/tracker.rs`, `src-tauri/src/usage/aggregator.rs`

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_record_open_creates_datapoint() {
        let tracker = UsageTracker::new_for_test();
        tracker.record_open("example.com".to_string()).await.unwrap();
        
        let stats = tracker.stats.read().await;
        assert_eq!(stats.datapoints.len(), 1);
        assert_eq!(stats.datapoints[0].host, "example.com");
    }

    #[test]
    fn test_cleanup_removes_old_datapoints() {
        let tracker = UsageTracker::new_for_test();
        
        // Add old datapoint (31 days ago)
        let old_timestamp = Utc::now() - Duration::days(31);
        tracker.add_datapoint_for_test("old.com", old_timestamp).await;
        
        // Add recent datapoint
        tracker.record_open("recent.com".to_string()).await.unwrap();
        
        let removed = tracker.cleanup_old_datapoints().await.unwrap();
        
        assert_eq!(removed, 1);
        let stats = tracker.stats.read().await;
        assert_eq!(stats.datapoints.len(), 1);
        assert_eq!(stats.datapoints[0].host, "recent.com");
    }

    #[test]
    fn test_aggregate_creates_correct_buckets() {
        let datapoints = vec![
            UsageDatapoint {
                host: "example.com".to_string(),
                timestamp: Utc::now() - Duration::minutes(30),
            },
            UsageDatapoint {
                host: "example.com".to_string(),
                timestamp: Utc::now() - Duration::minutes(15),
            },
        ];
        
        let aggregated = UsageAggregator::aggregate_host(
            &datapoints,
            "example.com",
            TimeRange::OneHour,
        );
        
        assert_eq!(aggregated.total_count, 2);
        assert_eq!(aggregated.time_buckets.len(), 60); // 60 minutes
    }

    #[test]
    fn test_clear_host_removes_only_that_host() {
        let tracker = UsageTracker::new_for_test();
        
        tracker.record_open("host1.com".to_string()).await.unwrap();
        tracker.record_open("host2.com".to_string()).await.unwrap();
        
        tracker.clear_host("host1.com".to_string()).await.unwrap();
        
        let stats = tracker.stats.read().await;
        assert_eq!(stats.datapoints.len(), 1);
        assert_eq!(stats.datapoints[0].host, "host2.com");
    }
}
```

#### Property-Based Tests

**Location**: `src-tauri/src/usage/proptests.rs`

```rust
#[cfg(test)]
mod proptests {
    use super::*;
    use proptest::prelude::*;

    // Feature: link-usage-tracking, Property 1: Link Open Recording
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]

        #[test]
        fn test_record_open_stores_datapoint(
            host in "[a-z]{1,20}\\.[a-z]{2,5}",
        ) {
            let tracker = UsageTracker::new_for_test();
            
            let result = tracker.record_open(host.clone()).await;
            prop_assert!(result.is_ok());
            
            let stats = tracker.stats.read().await;
            prop_assert!(stats.datapoints.iter().any(|d| d.host == host));
        }

        // Feature: link-usage-tracking, Property 5: Host Key Extraction
        #[test]
        fn test_host_extraction_from_url(
            host in "[a-z]{1,20}\\.[a-z]{2,5}",
            path in "/[a-z]{1,10}",
        ) {
            let url = format!("https://{}{}", host, path);
            let extracted = extract_host_from_url(&url);
            
            prop_assert_eq!(extracted, host);
        }

        // Feature: link-usage-tracking, Property 6: Time Range Aggregation
        #[test]
        fn test_time_range_bucket_sizes(
            time_range in prop::sample::select(vec![
                TimeRange::OneHour,
                TimeRange::TwelveHours,
                TimeRange::OneDay,
                TimeRange::ThreeDays,
                TimeRange::SevenDays,
                TimeRange::ThirtyDays,
            ]),
        ) {
            let bucket_duration = UsageAggregator::get_bucket_duration(time_range);
            
            let expected = match time_range {
                TimeRange::OneHour => Duration::minutes(1),
                TimeRange::TwelveHours => Duration::minutes(30),
                TimeRange::OneDay => Duration::hours(1),
                TimeRange::ThreeDays => Duration::hours(12),
                TimeRange::SevenDays => Duration::days(1),
                TimeRange::ThirtyDays => Duration::days(3),
            };
            
            prop_assert_eq!(bucket_duration, expected);
        }

        // Feature: link-usage-tracking, Property 12: Datapoint Cleanup
        #[test]
        fn test_cleanup_removes_old_keeps_recent(
            old_count in 1..50usize,
            recent_count in 1..50usize,
        ) {
            let tracker = UsageTracker::new_for_test();
            
            // Add old datapoints (31+ days ago)
            for i in 0..old_count {
                let timestamp = Utc::now() - Duration::days(31 + i as i64);
                tracker.add_datapoint_for_test(
                    &format!("old{}.com", i),
                    timestamp
                ).await;
            }
            
            // Add recent datapoints (within 30 days)
            for i in 0..recent_count {
                let timestamp = Utc::now() - Duration::days(i as i64);
                tracker.add_datapoint_for_test(
                    &format!("recent{}.com", i),
                    timestamp
                ).await;
            }
            
            let removed = tracker.cleanup_old_datapoints().await.unwrap();
            
            prop_assert_eq!(removed, old_count);
            
            let stats = tracker.stats.read().await;
            prop_assert_eq!(stats.datapoints.len(), recent_count);
        }

        // Feature: link-usage-tracking, Property 15: Storage Round Trip
        #[test]
        fn test_storage_round_trip(
            datapoints in prop::collection::vec(
                (
                    "[a-z]{1,20}\\.[a-z]{2,5}",
                    any::<i64>().prop_map(|secs| {
                        Utc::now() - Duration::seconds(secs.abs() % (30 * 24 * 3600))
                    })
                ),
                1..100
            ),
        ) {
            let tracker = UsageTracker::new_for_test();
            
            // Add datapoints
            for (host, timestamp) in &datapoints {
                tracker.add_datapoint_for_test(host, *timestamp).await;
            }
            
            // Save
            tracker.save().await.unwrap();
            
            // Load new tracker
            let tracker2 = UsageTracker::load_for_test().await.unwrap();
            
            let stats1 = tracker.stats.read().await;
            let stats2 = tracker2.stats.read().await;
            
            prop_assert_eq!(stats1.datapoints.len(), stats2.datapoints.len());
        }
    }
}
```

### Frontend Testing (TypeScript)

#### Component Tests

**Location**: `src/components/UsageBadge.test.tsx`, `src/components/StatisticsView.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { UsageBadge } from './UsageBadge';

describe('UsageBadge', () => {
  it('should display count', () => {
    render(<UsageBadge count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should display 0 for never opened', () => {
    render(<UsageBadge count={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should use gray color for 0 count', () => {
    const { container } = render(<UsageBadge count={0} />);
    const badge = container.querySelector('[data-badge]');
    expect(badge).toHaveAttribute('data-variant', 'light');
  });
});
```

#### Hook Tests

**Location**: `src/hooks/useUsageStats.test.ts`, `src/hooks/useUsageCounts.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useUsageCounts } from './useUsageCounts';

describe('useUsageCounts', () => {
  it('should load counts on mount', async () => {
    const { result } = renderHook(() => useUsageCounts());

    await waitFor(() => {
      expect(Object.keys(result.current.counts).length).toBeGreaterThan(0);
    });
  });

  it('should update count after recording open', async () => {
    const { result } = renderHook(() => useUsageCounts());

    const initialCount = result.current.counts['example.com'] || 0;
    
    await result.current.recordOpen('example.com');

    await waitFor(() => {
      expect(result.current.counts['example.com']).toBe(initialCount + 1);
    });
  });
});
```

#### Property-Based Tests

**Location**: `src/utils/aggregation.test.ts`

```typescript
import fc from 'fast-check';
import { aggregateDatapoints, TimeRange } from './aggregation';

// Feature: link-usage-tracking, Property 6: Time Range Aggregation
describe('Time Range Aggregation', () => {
  it('should create correct bucket sizes for all time ranges', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'OneHour',
          'TwelveHours',
          'OneDay',
          'ThreeDays',
          'SevenDays',
          'ThirtyDays'
        ),
        fc.array(fc.record({
          host: fc.domain(),
          timestamp: fc.date({ min: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }),
        })),
        (timeRange, datapoints) => {
          const aggregated = aggregateDatapoints(datapoints, timeRange as TimeRange);

          const expectedBucketCount = {
            OneHour: 60,
            TwelveHours: 24,
            OneDay: 24,
            ThreeDays: 6,
            SevenDays: 7,
            ThirtyDays: 10,
          }[timeRange];

          for (const agg of aggregated) {
            expect(agg.timeBuckets.length).toBe(expectedBucketCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: link-usage-tracking, Property 3: Top 10 Sorting
describe('Top 10 Sorting', () => {
  it('should sort top 10 by count descending', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 20 }),
          hosts: fc.array(fc.domain(), { minLength: 1, maxLength: 3 }),
        }), { minLength: 15, maxLength: 50 }),
        fc.dictionary(fc.domain(), fc.nat(100)),
        (ingresses, counts) => {
          const sorted = sortIngressesByUsage(ingresses, counts, '');

          // Top 10 should be in descending order
          for (let i = 0; i < Math.min(10, sorted.length - 1); i++) {
            const countA = counts[sorted[i].hosts[0]] || 0;
            const countB = counts[sorted[i + 1].hosts[0]] || 0;
            expect(countA).toBeGreaterThanOrEqual(countB);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Tests

**Location**: `src-tauri/tests/usage_integration.rs`

```rust
#[tokio::test]
async fn test_record_and_retrieve_usage() {
    let app = create_test_app().await;
    let state = app.state::<AppState>();

    // Record opens
    record_link_open("example.com".to_string(), state.clone(), app.handle())
        .await
        .unwrap();
    record_link_open("example.com".to_string(), state.clone(), app.handle())
        .await
        .unwrap();

    // Get stats
    let stats = get_usage_stats(TimeRange::OneDay, state.clone())
        .await
        .unwrap();

    assert_eq!(stats.len(), 1);
    assert_eq!(stats[0].host, "example.com");
    assert_eq!(stats[0].total_count, 2);
}

#[tokio::test]
async fn test_clear_host_removes_datapoints() {
    let app = create_test_app().await;
    let state = app.state::<AppState>();

    // Record opens for two hosts
    record_link_open("host1.com".to_string(), state.clone(), app.handle())
        .await
        .unwrap();
    record_link_open("host2.com".to_string(), state.clone(), app.handle())
        .await
        .unwrap();

    // Clear one host
    clear_host_usage("host1.com".to_string(), state.clone(), app.handle())
        .await
        .unwrap();

    // Verify only host2 remains
    let stats = get_usage_stats(TimeRange::OneDay, state.clone())
        .await
        .unwrap();

    assert_eq!(stats.len(), 1);
    assert_eq!(stats[0].host, "host2.com");
}
```

### Test Configuration

**Minimum Test Coverage**:
- Backend: 70% code coverage
- Frontend: 70% code coverage
- Property tests: 100 iterations per property
- Integration tests: All Tauri commands covered

**Test Execution**:
```bash
# Backend tests
cargo test
cargo test proptests

# Frontend tests
npm test
npm run test:coverage

# Integration tests
cargo test --test usage_integration
```
