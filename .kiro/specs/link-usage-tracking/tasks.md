# Implementation Plan: Link Usage Tracking and Statistics

## Overview

This implementation plan breaks down the link usage tracking and statistics feature into discrete, incremental tasks. Each task builds on previous work and includes testing to validate functionality early. The feature adds usage tracking for ingress links, displays usage count badges in search results, and provides a dedicated statistics view with sparkline and area chart visualizations.

## Tasks

- [x] 1. Backend Data Models and Storage
  - [x] 1.1 Create usage tracking data models
    - Create `src-tauri/src/usage/mod.rs` module
    - Define `UsageDatapoint` struct with host and timestamp fields
    - Define `UsageStats` struct with datapoints vector
    - Define `AggregatedUsage` struct with host, total_count, and time_buckets
    - Define `TimeBucket` struct with timestamp and count
    - Define `TimeRange` enum with all time range variants
    - Implement Serialize and Deserialize derives for all types
    - _Requirements: 1.1, 1.2, 11.1, 11.2_

  - [ ]* 1.2 Write unit tests for data models
    - Test UsageDatapoint serialization/deserialization
    - Test UsageStats serialization/deserialization
    - Test TimeRange enum variants
    - _Requirements: 17.1_

- [x] 2. Usage Tracker Implementation
  - [x] 2.1 Implement UsageTracker struct
    - Create `src-tauri/src/usage/tracker.rs`
    - Implement `UsageTracker::new()` to load from storage
    - Implement `record_open()` to add datapoints with second-precision timestamps
    - Implement `cleanup_old_datapoints()` to remove datapoints >30 days
    - Implement `clear_host()` to remove datapoints for specific host
    - Implement `clear_all()` to remove all datapoints
    - Implement `save()` to persist to tauri-plugin-store
    - Implement `load()` to load from tauri-plugin-store
    - Use `usage_stats.json` as storage file name
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.2, 9.4, 10.2, 11.5_

  - [ ]* 2.2 Write property test for link open recording
    - **Property 1: Link Open Recording**
    - **Validates: Requirements 1.1, 1.2, 1.3**
    - Generate random hosts and verify datapoints are stored
    - _Requirements: 17.2_

  - [ ]* 2.3 Write property test for storage round trip
    - **Property 15: Storage Round Trip**
    - **Validates: Requirements 1.3, 1.4**
    - Generate random datapoints, save, load, and verify equality
    - _Requirements: 17.2_

  - [ ]* 2.4 Write property test for datapoint cleanup
    - **Property 12: Datapoint Cleanup**
    - **Validates: Requirements 10.2**
    - Generate old and recent datapoints, cleanup, verify old removed
    - _Requirements: 17.2_

  - [ ]* 2.5 Write unit tests for error handling
    - Test graceful degradation on load failure
    - Test error logging on save failure
    - Test cleanup continues on error
    - _Requirements: 14.1, 14.2, 14.3, 17.1_

- [ ] 3. Usage Aggregator Implementation
  - [ ] 3.1 Implement UsageAggregator
    - Create `src-tauri/src/usage/aggregator.rs`
    - Implement `aggregate()` to aggregate all hosts by time range
    - Implement `aggregate_host()` to aggregate specific host
    - Implement `get_bucket_duration()` to calculate bucket size
    - Implement `get_cutoff_time()` to calculate time range start
    - Implement `create_time_buckets()` to generate empty buckets
    - Fill buckets with datapoint counts
    - _Requirements: 5.3, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 11.4_

  - [ ]* 3.2 Write property test for time range aggregation
    - **Property 6: Time Range Aggregation**
    - **Validates: Requirements 7.3-7.8, 5.3**
    - Generate random datapoints and verify bucket sizes for all time ranges
    - _Requirements: 17.2_

  - [ ]* 3.3 Write unit tests for aggregation edge cases
    - Test aggregation with no datapoints
    - Test aggregation with single datapoint
    - Test aggregation with datapoints outside time range
    - Test bucket filling with gaps
    - _Requirements: 17.1_

- [ ] 4. Extend AppState with Usage Tracker
  - [ ] 4.1 Add usage_tracker field to AppState
    - Modify `src-tauri/src/state/app_state.rs`
    - Add `usage_tracker: Arc<UsageTracker>` field
    - Initialize UsageTracker in `AppState::new()`
    - Pass AppHandle to UsageTracker for storage access
    - _Requirements: 1.4, 13.5_

  - [ ]* 4.2 Write integration test for AppState with usage tracker
    - Test AppState initialization includes usage tracker
    - Test usage tracker is accessible from state
    - _Requirements: 17.3_

- [ ] 5. Tauri Commands for Usage Tracking
  - [ ] 5.1 Create usage tracking commands
    - Create `src-tauri/src/commands/usage.rs`
    - Implement `record_link_open(host, state, app_handle)` command
    - Implement `get_usage_stats(time_range, state)` command
    - Implement `get_host_usage(host, time_range, state)` command
    - Implement `clear_host_usage(host, state, app_handle)` command
    - Implement `clear_all_usage(state, app_handle)` command
    - Implement `get_host_count(host, state)` command
    - Implement `get_all_counts(state)` command
    - Emit "usage-stats-updated" event after mutations
    - Return Result<T, String> for error handling
    - _Requirements: 1.1, 2.5, 3.5, 4.5, 8.2, 8.3, 8.4, 8.5, 9.4, 9.6, 9.7, 13.4_

  - [ ] 5.2 Register usage commands in main.rs
    - Add usage commands to `invoke_handler` in `src-tauri/src/main.rs`
    - _Requirements: 13.4_

  - [ ]* 5.3 Write integration tests for Tauri commands
    - Test record_link_open creates datapoint
    - Test get_usage_stats returns aggregated data
    - Test clear_host_usage removes host datapoints
    - Test clear_all_usage removes all datapoints
    - Test get_all_counts returns correct counts
    - _Requirements: 17.3_

- [ ] 6. Integrate Cleanup with Refresh Task
  - [ ] 6.1 Add cleanup to refresh task
    - Modify `src-tauri/src/refresh/task.rs`
    - Call `cleanup_old_datapoints()` before fetching ingresses
    - Log number of datapoints removed
    - Emit "usage-stats-updated" event if datapoints removed
    - Continue refresh even if cleanup fails
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 14.3_

  - [ ]* 6.2 Write integration test for cleanup in refresh
    - Test cleanup runs during refresh
    - Test refresh continues if cleanup fails
    - Test event emitted after cleanup
    - _Requirements: 17.3_

- [ ] 7. Frontend TypeScript Types
  - [ ] 7.1 Create usage tracking types
    - Create `src/types/usage.ts`
    - Define `UsageDatapoint` interface
    - Define `TimeBucket` interface
    - Define `AggregatedUsage` interface
    - Define `TimeRange` type union
    - Define `TimeRangeOption` interface
    - Export all types
    - _Requirements: 5.1, 5.2, 7.1, 7.2_

  - [ ]* 7.2 Write type tests
    - Test type definitions compile correctly
    - Test type compatibility with Rust types
    - _Requirements: 17.4_

- [ ] 8. Usage Counts Hook
  - [ ] 8.1 Create useUsageCounts hook
    - Create `src/hooks/useUsageCounts.ts`
    - Call `get_all_counts` command on mount
    - Listen for "usage-stats-updated" events
    - Implement `recordOpen(host)` function
    - Optimistically update local state after recording
    - Return `{ counts, recordOpen }` object
    - _Requirements: 1.1, 2.2, 2.5, 15.1_

  - [ ]* 8.2 Write hook tests for useUsageCounts
    - Test counts load on mount
    - Test recordOpen updates count
    - Test event listener updates counts
    - _Requirements: 17.4_

- [ ] 9. Usage Statistics Hook
  - [ ] 9.1 Create useUsageStats hook
    - Create `src/hooks/useUsageStats.ts`
    - Accept `timeRange` parameter
    - Call `get_usage_stats` command with time range
    - Listen for "usage-stats-updated" events
    - Implement `clearHost(host)` function
    - Implement `clearAll()` function
    - Implement `refresh()` function
    - Return `{ stats, loading, error, clearHost, clearAll, refresh }` object
    - _Requirements: 4.3, 4.5, 5.2, 5.4, 7.9, 8.2, 8.3, 8.4, 8.5, 9.4, 9.6, 9.7_

  - [ ]* 9.2 Write hook tests for useUsageStats
    - Test stats load on mount
    - Test stats update when time range changes
    - Test clearHost removes host
    - Test clearAll removes all stats
    - Test event listener triggers refresh
    - _Requirements: 17.4_

- [ ] 10. Usage Badge Component
  - [ ] 10.1 Create UsageBadge component
    - Create `src/components/UsageBadge.tsx`
    - Accept `count` prop
    - Use Mantine Badge component
    - Display count value
    - Use blue color for count > 0, gray for count = 0
    - Use "light" variant
    - Position with `marginLeft: 'auto'` style
    - _Requirements: 2.1, 2.2, 2.4, 15.2_

  - [ ]* 10.2 Write component tests for UsageBadge
    - Test displays count correctly
    - Test displays 0 for never opened
    - Test uses correct color for 0 vs >0
    - _Requirements: 17.4_

- [ ] 11. Integrate Usage Badge with IngressItem
  - [ ] 11.1 Modify IngressItem component
    - Import `useUsageCounts` hook
    - Import `UsageBadge` component
    - Get counts from hook
    - Add UsageBadge to item layout (right side)
    - Pass `counts[ingress.hosts[0]] || 0` to badge
    - Call `recordOpen(host)` before opening URL
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 15.1_

  - [ ]* 11.2 Write component tests for IngressItem with badge
    - Test badge displays correct count
    - Test recordOpen called when URL clicked
    - Test badge updates after recording open
    - _Requirements: 17.4_

- [ ] 12. Implement Top 10 Sorting in IngressList
  - [ ] 12.1 Modify IngressList component
    - Import `useUsageCounts` hook
    - Get counts from hook
    - Use `useMemo` to sort ingresses
    - When searchTerm is empty: sort by count descending, take top 10, append rest
    - When searchTerm is not empty: use filtered results in current order
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 12.2 Write property test for top 10 sorting
    - **Property 3: Top 10 Sorting**
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - Generate random ingresses and counts, verify top 10 sorted correctly
    - _Requirements: 17.2_

  - [ ]* 12.3 Write component tests for IngressList sorting
    - Test top 10 appear first when search empty
    - Test top 10 sorted descending by count
    - Test rest appear after top 10
    - Test no sorting when search not empty
    - _Requirements: 17.4_

- [ ] 13. Statistics Item Component
  - [ ] 13.1 Create StatisticsItem component
    - Create `src/components/StatisticsItem.tsx`
    - Accept `stat`, `timeRange`, `onClear`, `onSparklineClick` props
    - Use Mantine Paper component with border
    - Display host, total count
    - Display "Clear" button (red, light variant)
    - Extract sparkline data from time buckets
    - Render Mantine Sparkline component
    - Make sparkline clickable (cursor: pointer)
    - Call `onSparklineClick` when sparkline clicked
    - _Requirements: 4.4, 5.1, 5.2, 8.1_

  - [ ]* 13.2 Write component tests for StatisticsItem
    - Test displays host and count
    - Test displays sparkline
    - Test clear button calls onClear
    - Test sparkline click calls onSparklineClick
    - _Requirements: 17.4_

- [ ] 14. Area Chart Modal Component
  - [ ] 14.1 Create AreaChartModal component
    - Create `src/components/AreaChartModal.tsx`
    - Accept `host`, `timeRange`, `onClose` props
    - Use Mantine Modal component (size="xl")
    - Call `get_host_usage` command on mount
    - Display loading state while fetching
    - Transform time buckets to chart data format
    - Render Mantine AreaChart component
    - Set chart height to 400px
    - Use "linear" curve type
    - Set fillOpacity to 0.3
    - Add value formatter for "X opens"
    - Display host in modal title
    - Display total count above chart
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 14.2 Write component tests for AreaChartModal
    - Test displays loading state
    - Test fetches host usage data
    - Test displays area chart with data
    - Test displays host in title
    - Test close button works
    - _Requirements: 17.4_

- [ ] 15. Statistics View Component
  - [ ] 15.1 Create StatisticsView component
    - Create `src/components/StatisticsView.tsx`
    - Use `useState` for timeRange (default: 'SevenDays')
    - Use `useState` for selectedHost (for modal)
    - Use `useUsageStats` hook with timeRange
    - Use Mantine Stack for layout (padding, full height)
    - Display "Usage Statistics" title
    - Display time range Select dropdown
    - Populate Select with time range options
    - Display loading state with Loader
    - Display error state with Alert
    - Use ScrollArea for statistics list (flex: 1)
    - Map stats to StatisticsItem components
    - Display "Clear All Statistics" button (red, light variant)
    - Show confirmation modal on "Clear All" click
    - Render AreaChartModal when host selected
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.4, 7.1, 7.2, 7.9, 8.1, 9.1, 9.2, 9.3, 14.4_

  - [ ]* 15.2 Write component tests for StatisticsView
    - Test displays title and time selector
    - Test displays loading state
    - Test displays error state
    - Test displays statistics items
    - Test time selector changes update stats
    - Test clear all button shows confirmation
    - Test confirmation clears all stats
    - Test cancel keeps stats
    - _Requirements: 17.4_

- [ ] 16. Statistics Window Management
  - [ ] 16.1 Create statistics window in Tauri
    - Modify `tauri.conf.json` to add statistics window configuration
    - Set window label to "statistics"
    - Set title to "Usage Statistics"
    - Set width to 800, height to 600
    - Set resizable to true
    - Set decorations to true (standard window chrome)
    - Set visible to false (hidden by default)
    - Set center to true
    - Set minWidth to 600, minHeight to 400
    - _Requirements: 12.1, 12.2, 12.3, 12.7_

  - [ ] 16.2 Create Tauri command to open statistics window
    - Add `open_statistics_window` command in `src-tauri/src/commands/window.rs`
    - Get or create statistics window
    - Show and focus window
    - Center window if first time opening
    - _Requirements: 4.2, 12.1_

  - [ ] 16.3 Add "Statistics" menu item to tray
    - Modify tray menu setup in `src-tauri/src/main.rs`
    - Add "Statistics" menu item
    - Call `open_statistics_window` when clicked
    - _Requirements: 4.1_

  - [ ] 16.4 Implement window state persistence
    - Save window size and position on close
    - Load window size and position on open
    - Use tauri-plugin-store for persistence
    - _Requirements: 12.4_

  - [ ]* 16.5 Write integration tests for window management
    - Test statistics window opens
    - Test window has correct properties
    - Test window state persists
    - Test menu item opens window
    - _Requirements: 17.3_

- [ ] 17. Statistics View Routing
  - [ ] 17.1 Create statistics route/page
    - Create `src/pages/Statistics.tsx` (or integrate into routing)
    - Render StatisticsView component
    - Apply theme from settings
    - _Requirements: 4.2, 15.3_

  - [ ] 17.2 Setup routing for statistics window
    - Configure routing to show Statistics page in statistics window
    - Ensure theme provider wraps statistics page
    - _Requirements: 15.3_

- [ ] 18. Time Range Selector Configuration
  - [ ] 18.1 Create time range constants
    - Create `src/constants/timeRanges.ts`
    - Define TIME_RANGE_OPTIONS array with all options
    - Each option: value, label, bucketLabel
    - Export constants
    - _Requirements: 7.1, 7.2_

  - [ ] 18.2 Persist time range preference
    - Add `statisticsTimeRange` field to Settings type
    - Default to 'SevenDays'
    - Save to settings when changed
    - Load from settings on mount
    - _Requirements: 7.10_

  - [ ]* 18.3 Write tests for time range persistence
    - Test time range saves to settings
    - Test time range loads from settings
    - _Requirements: 17.1_

- [ ] 19. Clear Confirmation Modal
  - [ ] 19.1 Create ClearConfirmationModal component
    - Create `src/components/ClearConfirmationModal.tsx`
    - Accept `opened`, `onConfirm`, `onCancel` props
    - Use Mantine Modal component
    - Display warning message: "Are you sure you want to clear all usage statistics? This cannot be undone."
    - Display "Cancel" button (calls onCancel)
    - Display "Clear All" button (red, calls onConfirm)
    - _Requirements: 9.2, 9.3, 9.5_

  - [ ]* 19.2 Write component tests for ClearConfirmationModal
    - Test displays warning message
    - Test cancel button calls onCancel
    - Test clear button calls onConfirm
    - _Requirements: 17.4_

- [ ] 20. Error Handling and Edge Cases
  - [ ] 20.1 Add error handling to frontend hooks
    - Wrap all invoke calls in try-catch
    - Set error state on failures
    - Log errors to console
    - Continue operation on non-critical errors
    - _Requirements: 14.1, 14.2, 14.4_

  - [ ] 20.2 Add error handling to backend commands
    - Validate inputs (non-empty host, valid time range)
    - Handle storage errors gracefully
    - Log errors with context
    - Return descriptive error messages
    - _Requirements: 14.1, 14.2, 14.3, 17.1_

  - [ ]* 20.3 Write property test for error resilience
    - **Property 17: Error Resilience**
    - **Validates: Requirements 14.1, 14.2, 14.3**
    - Simulate storage failures, verify system continues
    - _Requirements: 17.2_

- [ ] 21. Performance Optimization
  - [ ] 21.1 Optimize aggregation performance
    - Use efficient data structures (HashMap for grouping)
    - Pre-allocate vectors with known capacity
    - Avoid unnecessary clones
    - _Requirements: 13.4, 13.5_

  - [ ] 21.2 Optimize frontend rendering
    - Use React.memo for StatisticsItem
    - Use useMemo for expensive computations
    - Debounce time range selector changes
    - _Requirements: 13.2, 13.3_

  - [ ]* 21.3 Write performance tests
    - Test aggregation with 10,000 datapoints
    - Test rendering with 100 statistics items
    - Verify performance meets requirements
    - _Requirements: 13.5_

- [ ] 22. Integration and Testing
  - [ ] 22.1 Manual testing checklist
    - Test recording link opens updates badges
    - Test top 10 sorting when search empty
    - Test statistics view displays correctly
    - Test sparklines render for all time ranges
    - Test area chart modal opens and displays data
    - Test time range selector updates all charts
    - Test clear host removes datapoints
    - Test clear all removes all datapoints
    - Test cleanup removes old datapoints
    - Test statistics persist across restarts
    - Test window state persists across sessions
    - Test theme applies to statistics window
    - Test error handling for storage failures
    - _Requirements: All_

  - [ ]* 22.2 Run all property tests
    - Execute all property tests with 100 iterations
    - Verify all properties pass
    - _Requirements: 17.2_

  - [ ]* 22.3 Run all unit tests
    - Execute cargo test for backend
    - Execute npm test for frontend
    - Verify all tests pass
    - _Requirements: 17.1, 17.4_

  - [ ]* 22.4 Run integration tests
    - Execute integration tests for Tauri commands
    - Execute integration tests for window management
    - Verify all tests pass
    - _Requirements: 17.3_

- [ ] 23. Documentation
  - [ ] 23.1 Update README with usage tracking feature
    - Document usage tracking functionality
    - Document statistics view features
    - Document time range options
    - Document data retention policy (30 days)
    - _Requirements: All_

  - [ ] 23.2 Add inline code documentation
    - Document all public functions and structs
    - Add JSDoc comments to TypeScript code
    - Document aggregation algorithm
    - Document storage format
    - _Requirements: All_

## Notes

- Tasks marked with `*` are optional testing tasks that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100 iterations
- Unit tests validate specific examples and edge cases
- Integration tests validate component interactions
- Manual testing ensures end-to-end functionality
- Build and test verification required before marking tasks complete
