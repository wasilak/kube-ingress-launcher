# Requirements Document: Link Usage Tracking and Statistics

## Introduction

This document specifies the requirements for adding link usage tracking and statistics visualization to the kube-ingress-desktop application. The feature will track how many times ingress links are opened, display usage counts in the search interface, and provide a dedicated statistics view with sparkline and area chart visualizations.

## Glossary

- **Link**: A URL constructed from an ingress resource (protocol + host + path)
- **Open Event**: An action where a user clicks a link to open it in their browser
- **Datapoint**: A single recorded open event with second-precision timestamp
- **Ingress Host**: The hostname portion of an ingress URL, used as the tracking key
- **Sparkline**: A small inline chart showing usage trends over time
- **Area Chart**: A larger detailed chart showing usage over time with filled area
- **Statistics View**: A dedicated screen showing top opened links with visualizations
- **Time Selector**: A dropdown allowing users to filter statistics by time range
- **Usage Count**: The total number of times a link has been opened
- **Badge**: A visual indicator displaying the usage count next to a search result

## Requirements

### Requirement 1: Track Link Opens by Ingress Host

**User Story:** As a user, I want the application to track how many times I open each ingress link, so that I can see which services I access most frequently.

#### Acceptance Criteria

1. WHEN a user clicks a link to open it, THE System SHALL record an open event with the ingress host as the key
2. WHEN recording an open event, THE System SHALL store a datapoint with second-precision timestamp
3. THE System SHALL persist all datapoints to local storage immediately after recording
4. WHEN the application starts, THE System SHALL load all persisted datapoints from storage
5. THE System SHALL use the ingress host (not the full URL) as the tracking key to aggregate opens across all paths

### Requirement 2: Display Usage Count Badges in Search Results

**User Story:** As a user, I want to see how many times I've opened each ingress link directly in the search results, so that I can quickly identify my most-used services.

#### Acceptance Criteria

1. WHEN displaying search results, THE System SHALL show a usage count badge for every ingress item
2. THE Badge SHALL display the total number of opens for that ingress host
3. THE Badge SHALL be positioned on the right side of each search result item
4. WHEN an ingress has never been opened, THE Badge SHALL display "0"
5. THE Badge SHALL update immediately after a link is opened

### Requirement 3: Prioritize Top Links When Search is Empty

**User Story:** As a user, I want to see my most frequently accessed ingresses at the top when I open the search window, so that I can quickly access my common services.

#### Acceptance Criteria

1. WHEN the search input is empty, THE System SHALL display the top 10 most-opened ingresses at the top of the list
2. THE Top 10 SHALL be sorted in descending order by total open count
3. WHEN the search input is empty, THE System SHALL display all other ingresses below the top 10 in their current order
4. WHEN the search input is not empty, THE System SHALL display filtered results in their current order without prioritization
5. THE System SHALL recalculate the top 10 list whenever usage statistics change

### Requirement 4: Statistics View with Top Links

**User Story:** As a user, I want a dedicated statistics screen showing my most-accessed ingresses, so that I can analyze my usage patterns.

#### Acceptance Criteria

1. THE System SHALL provide a "Statistics" menu item in the taskbar menu
2. WHEN the user selects "Statistics", THE System SHALL open a statistics view window
3. THE Statistics View SHALL display the top 10 most-opened ingresses in descending order by open count
4. THE Statistics View SHALL show the ingress name, namespace, host, and total open count for each entry
5. THE Statistics View SHALL update immediately when usage data changes

### Requirement 5: Sparkline Visualization in Statistics View

**User Story:** As a user, I want to see a small chart showing usage trends for each ingress in the statistics view, so that I can quickly understand usage patterns over time.

#### Acceptance Criteria

1. THE System SHALL display a sparkline chart beside every ingress entry in the statistics view
2. THE Sparkline SHALL visualize usage over the selected time range
3. THE Sparkline SHALL aggregate datapoints according to the selected time range granularity
4. WHEN the time selector changes, THE System SHALL update all sparklines to reflect the new time range
5. THE Sparkline SHALL use Mantine's Sparkline component for rendering

### Requirement 6: Detailed Area Chart Modal

**User Story:** As a user, I want to click on a sparkline to see a detailed chart of usage over time, so that I can analyze specific usage patterns in depth.

#### Acceptance Criteria

1. WHEN a user clicks a sparkline, THE System SHALL open a modal with a detailed area chart
2. THE Area Chart SHALL show usage over the selected time range with filled area visualization
3. THE Area Chart SHALL use the same time range and aggregation as the sparkline
4. THE Area Chart SHALL display axis labels showing time and usage count
5. THE Modal SHALL include the ingress name, namespace, and host in the title
6. WHEN the user closes the modal, THE System SHALL return to the statistics view
7. THE Area Chart SHALL use Mantine's AreaChart component for rendering

### Requirement 7: Time Range Selector

**User Story:** As a user, I want to select different time ranges for viewing statistics, so that I can analyze usage patterns over various periods.

#### Acceptance Criteria

1. THE Statistics View SHALL display a time selector dropdown at the top
2. THE Time Selector SHALL offer these options: "1 hour", "12 hours", "24 hours", "3 days", "7 days", "30 days"
3. WHEN "1 hour" is selected, THE System SHALL aggregate datapoints by minute (1-minute buckets)
4. WHEN "12 hours" is selected, THE System SHALL aggregate datapoints by 30 minutes (30-minute buckets)
5. WHEN "24 hours" is selected, THE System SHALL aggregate datapoints by hour (1-hour buckets)
6. WHEN "3 days" is selected, THE System SHALL aggregate datapoints by 12 hours (12-hour buckets)
7. WHEN "7 days" is selected, THE System SHALL aggregate datapoints by day (1-day buckets)
8. WHEN "30 days" is selected, THE System SHALL aggregate datapoints by 3 days (3-day buckets)
9. WHEN the time selector changes, THE System SHALL update all sparklines and area charts immediately
10. THE System SHALL persist the selected time range preference to settings

### Requirement 8: Clear Individual Statistics

**User Story:** As a user, I want to clear usage statistics for a specific ingress, so that I can reset tracking for services I no longer use frequently.

#### Acceptance Criteria

1. THE System SHALL display a "Clear" button beside each entry in the statistics view
2. WHEN the user clicks "Clear", THE System SHALL remove all datapoints for that ingress host
3. WHEN datapoints are cleared, THE System SHALL update the statistics view immediately
4. WHEN datapoints are cleared, THE System SHALL update all usage count badges immediately
5. WHEN datapoints are cleared, THE System SHALL recalculate the top 10 list immediately

### Requirement 9: Clear All Statistics

**User Story:** As a user, I want to clear all usage statistics at once, so that I can start fresh with tracking.

#### Acceptance Criteria

1. THE Statistics View SHALL display a "Clear All Statistics" button below the list
2. WHEN the user clicks "Clear All Statistics", THE System SHALL display a confirmation modal
3. THE Confirmation Modal SHALL ask "Are you sure you want to clear all usage statistics? This cannot be undone."
4. WHEN the user confirms, THE System SHALL remove all datapoints for all ingress hosts
5. WHEN the user cancels, THE System SHALL close the modal without clearing data
6. WHEN all datapoints are cleared, THE System SHALL update the statistics view immediately
7. WHEN all datapoints are cleared, THE System SHALL update all usage count badges to "0" immediately

### Requirement 10: Automatic Datapoint Cleanup

**User Story:** As a system administrator, I want old usage data to be automatically removed, so that storage usage remains reasonable over time.

#### Acceptance Criteria

1. WHEN the ingress refresh task runs (manual or interval), THE System SHALL check all datapoints for age
2. THE System SHALL remove all datapoints with timestamps older than 30 days
3. THE System SHALL perform cleanup before fetching new ingress data
4. WHEN datapoints are removed during cleanup, THE System SHALL update statistics immediately
5. THE System SHALL log the number of datapoints removed during cleanup

### Requirement 11: Datapoint Storage Format

**User Story:** As a developer, I want datapoints stored in a simple format without aggregation, so that the system can flexibly aggregate data for different time ranges.

#### Acceptance Criteria

1. THE System SHALL store each datapoint as a separate record
2. EACH Datapoint SHALL contain: ingress host (string), timestamp (ISO 8601 with second precision)
3. THE System SHALL NOT pre-aggregate datapoints during storage
4. THE System SHALL aggregate datapoints on-demand when displaying statistics
5. THE System SHALL use tauri-plugin-store for persistent storage of datapoints

### Requirement 12: Statistics View Window Management

**User Story:** As a user, I want the statistics view to behave like a standard application window, so that I can interact with it naturally.

#### Acceptance Criteria

1. THE Statistics View SHALL open as a separate window (not a modal overlay)
2. THE Statistics View Window SHALL have standard window decorations (title bar, close button)
3. THE Statistics View Window SHALL be resizable
4. THE Statistics View Window SHALL remember its size and position across sessions
5. WHEN the statistics window is closed, THE System SHALL return focus to the main search window if it was open
6. THE User SHALL be able to open the statistics window while the search window is open
7. THE Statistics View Window SHALL have a minimum width of 600px and minimum height of 400px

### Requirement 13: Performance Requirements

**User Story:** As a user, I want statistics to load and update quickly, so that the application remains responsive.

#### Acceptance Criteria

1. THE System SHALL load all datapoints from storage in less than 100ms
2. THE System SHALL update usage count badges in less than 50ms after recording an open event
3. THE System SHALL render sparklines in less than 100ms when opening the statistics view
4. THE System SHALL aggregate datapoints for display in less than 50ms
5. THE System SHALL handle at least 10,000 datapoints without performance degradation

### Requirement 14: Error Handling

**User Story:** As a user, I want the application to handle errors gracefully when tracking usage, so that failures don't disrupt my workflow.

#### Acceptance Criteria

1. WHEN storage write fails, THE System SHALL log the error and continue operation
2. WHEN storage read fails, THE System SHALL initialize with empty statistics and log the error
3. WHEN datapoint cleanup fails, THE System SHALL log the error and continue with refresh
4. WHEN statistics view fails to render, THE System SHALL display an error message in the window
5. THE System SHALL never crash or hang due to usage tracking errors

### Requirement 15: Integration with Existing Features

**User Story:** As a user, I want usage tracking to integrate seamlessly with existing search and ingress features, so that the application feels cohesive.

#### Acceptance Criteria

1. THE System SHALL track opens for all ingress links regardless of how they are accessed (search, top 10, etc.)
2. THE Usage Count Badge SHALL use the same visual style as the existing TLS badge
3. THE Statistics View SHALL use the same theme (light/dark/system) as the main application
4. WHEN an ingress is removed from Kubernetes, THE System SHALL retain its usage statistics
5. THE Statistics View SHALL display ingresses even if they no longer exist in the current cluster
