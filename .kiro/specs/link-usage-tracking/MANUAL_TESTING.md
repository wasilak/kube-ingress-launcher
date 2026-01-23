# Manual Testing Checklist: Link Usage Tracking and Statistics

## Overview

This document provides a comprehensive manual testing checklist for the link usage tracking and statistics feature. All tests must pass before the feature is considered complete.

## Prerequisites

- Application built successfully: `npm run tauri build`
- Development environment ready: `npm run tauri dev`
- Kubernetes cluster accessible with ingress resources
- Clean state (or known state) for testing

## Test Environment Setup

1. **Start the application in development mode:**
   ```bash
   npm run tauri dev
   ```

2. **Verify application starts without errors:**
   - [ ] Application window opens
   - [ ] No console errors in terminal
   - [ ] Search window displays ingress list

3. **Prepare test data:**
   - [ ] At least 15 ingress resources available in cluster
   - [ ] Ingresses have different hosts for testing

---

## Test 1: Recording Link Opens Updates Badges

**Objective:** Verify that clicking ingress links records opens and updates usage count badges.

### Steps:

1. **Initial State:**
   - [ ] Open search window (Cmd+Shift+K or from menu bar)
   - [ ] Observe all ingress items have usage badges
   - [ ] Note initial count for a specific ingress (should be 0 or existing count)

2. **Record Opens:**
   - [ ] Click on an ingress URL to open it in browser
   - [ ] Verify browser opens with correct URL
   - [ ] Return to search window

3. **Verify Badge Update:**
   - [ ] Badge count increased by 1 immediately
   - [ ] Badge color is blue (not gray) for count > 0
   - [ ] Badge displays correct number

4. **Multiple Opens:**
   - [ ] Click same ingress URL 2 more times
   - [ ] Verify badge increments each time (should show +3 total)
   - [ ] Badge updates happen immediately without delay

5. **Different Ingresses:**
   - [ ] Click URLs from 3 different ingresses
   - [ ] Verify each ingress badge updates independently
   - [ ] Verify counts are tracked separately per host

**Expected Results:**
- ✅ Badge displays 0 for never-opened ingresses
- ✅ Badge increments immediately after each open
- ✅ Badge color changes from gray to blue when count > 0
- ✅ Each ingress host tracked independently

---

## Test 2: Top 10 Sorting When Search Empty

**Objective:** Verify that the most-opened ingresses appear at the top when search is empty.

### Steps:

1. **Setup - Create Usage Pattern:**
   - [ ] Clear all statistics (from Statistics window)
   - [ ] Open search window
   - [ ] Click different ingress URLs to create usage pattern:
     - Ingress A: 10 times
     - Ingress B: 8 times
     - Ingress C: 6 times
     - Ingress D: 4 times
     - Ingress E: 2 times
     - Ingress F-J: 1 time each
     - Remaining ingresses: 0 times

2. **Verify Top 10 Sorting:**
   - [ ] Close and reopen search window (Cmd+Shift+K)
   - [ ] Verify search input is empty
   - [ ] Verify first 10 ingresses are sorted by usage count (descending)
   - [ ] Verify Ingress A appears first (10 opens)
   - [ ] Verify Ingress E appears in top 10 (2 opens)
   - [ ] Verify ingresses with 0 opens appear after top 10

3. **Verify Search Disables Sorting:**
   - [ ] Type any search term in search input
   - [ ] Verify results are filtered (not sorted by usage)
   - [ ] Clear search input
   - [ ] Verify top 10 sorting returns

4. **Verify Dynamic Updates:**
   - [ ] With empty search, click an ingress URL that was not in top 10
   - [ ] Verify list re-sorts immediately
   - [ ] Verify newly-clicked ingress moves up in ranking

**Expected Results:**
- ✅ Top 10 most-opened ingresses appear first when search empty
- ✅ Top 10 sorted in descending order by open count
- ✅ Remaining ingresses appear after top 10
- ✅ Search filtering disables usage-based sorting
- ✅ List updates dynamically as usage changes

---

## Test 3: Statistics View Displays Correctly

**Objective:** Verify the statistics view window opens and displays usage data correctly.

### Steps:

1. **Open Statistics Window:**
   - [ ] Click menu bar icon
   - [ ] Click "Statistics" menu item
   - [ ] Verify statistics window opens

2. **Verify Window Properties:**
   - [ ] Window has title "Usage Statistics"
   - [ ] Window has standard decorations (title bar, close button)
   - [ ] Window is resizable (drag corners/edges)
   - [ ] Window can be moved
   - [ ] Minimum size enforced (600x400)

3. **Verify Content Layout:**
   - [ ] Title "Usage Statistics" displayed at top
   - [ ] Time range selector dropdown visible
   - [ ] Statistics list displays below selector
   - [ ] "Clear All Statistics" button at bottom
   - [ ] Scroll area works if many statistics

4. **Verify Statistics Items:**
   - [ ] Each item shows host name
   - [ ] Each item shows total open count
   - [ ] Each item has sparkline chart
   - [ ] Each item has "Clear" button
   - [ ] Items sorted by total count (descending)

5. **Verify Data Accuracy:**
   - [ ] Compare counts in statistics view with badge counts in search window
   - [ ] Verify counts match exactly
   - [ ] Verify all opened ingresses appear in statistics

6. **Verify Empty State:**
   - [ ] Clear all statistics
   - [ ] Verify statistics view shows empty state or no items
   - [ ] Verify no errors displayed

**Expected Results:**
- ✅ Statistics window opens from menu bar
- ✅ Window has correct title and decorations
- ✅ Window is resizable with minimum size
- ✅ All UI elements display correctly
- ✅ Statistics data matches actual usage
- ✅ Items sorted by usage count

---

## Test 4: Sparklines Render for All Time Ranges

**Objective:** Verify sparklines render correctly for all time range options.

### Steps:

1. **Setup - Create Time-Distributed Data:**
   - [ ] Clear all statistics
   - [ ] Open ingress URLs at different times:
     - Open Ingress A: 5 times now
     - Wait 5 minutes
     - Open Ingress A: 3 times
     - Open Ingress B: 2 times
     - (Or use existing data with time distribution)

2. **Test Each Time Range:**

   **1 Hour:**
   - [ ] Select "1 hour" from time range dropdown
   - [ ] Verify sparklines update immediately
   - [ ] Verify sparklines show minute-by-minute data
   - [ ] Verify sparklines have appropriate granularity

   **12 Hours:**
   - [ ] Select "12 hours" from dropdown
   - [ ] Verify sparklines update
   - [ ] Verify 30-minute bucket aggregation

   **24 Hours:**
   - [ ] Select "24 hours" from dropdown
   - [ ] Verify sparklines update
   - [ ] Verify hourly bucket aggregation

   **3 Days:**
   - [ ] Select "3 days" from dropdown
   - [ ] Verify sparklines update
   - [ ] Verify 12-hour bucket aggregation

   **7 Days:**
   - [ ] Select "7 days" from dropdown
   - [ ] Verify sparklines update
   - [ ] Verify daily bucket aggregation

   **30 Days:**
   - [ ] Select "30 days" from dropdown
   - [ ] Verify sparklines update
   - [ ] Verify 3-day bucket aggregation

3. **Verify Sparkline Properties:**
   - [ ] Sparklines are visible and rendered
   - [ ] Sparklines show data trends
   - [ ] Sparklines use appropriate colors
   - [ ] Sparklines are clickable (cursor changes to pointer)

4. **Verify No Errors:**
   - [ ] No console errors when switching time ranges
   - [ ] No visual glitches or rendering issues
   - [ ] Smooth transitions between time ranges

**Expected Results:**
- ✅ All 6 time ranges work correctly
- ✅ Sparklines update immediately when time range changes
- ✅ Correct bucket granularity for each time range
- ✅ Sparklines render without errors
- ✅ Sparklines are interactive (clickable)

---

## Test 5: Area Chart Modal Opens and Displays Data

**Objective:** Verify clicking sparklines opens detailed area chart modal.

### Steps:

1. **Open Area Chart:**
   - [ ] In statistics view, click on a sparkline
   - [ ] Verify modal opens

2. **Verify Modal Properties:**
   - [ ] Modal has size "xl" (large)
   - [ ] Modal has close button (X)
   - [ ] Modal title shows host name
   - [ ] Modal displays total open count

3. **Verify Area Chart:**
   - [ ] Area chart renders correctly
   - [ ] Chart height is 400px
   - [ ] Chart shows filled area under line
   - [ ] Chart has axis labels (time and count)
   - [ ] Chart uses linear curve type
   - [ ] Chart has legend
   - [ ] Chart data matches sparkline data

4. **Verify Chart Interactivity:**
   - [ ] Hover over chart shows tooltips
   - [ ] Tooltips show timestamp and count
   - [ ] Tooltips format: "X opens"

5. **Test Different Time Ranges:**
   - [ ] Close modal
   - [ ] Change time range selector
   - [ ] Click sparkline again
   - [ ] Verify area chart reflects new time range
   - [ ] Repeat for multiple time ranges

6. **Close Modal:**
   - [ ] Click close button (X)
   - [ ] Verify modal closes
   - [ ] Verify returns to statistics view
   - [ ] Click outside modal (if supported)
   - [ ] Verify modal closes

**Expected Results:**
- ✅ Modal opens when sparkline clicked
- ✅ Modal displays host name and total count
- ✅ Area chart renders with correct data
- ✅ Chart is interactive with tooltips
- ✅ Chart reflects selected time range
- ✅ Modal closes properly

---

## Test 6: Time Range Selector Updates All Charts

**Objective:** Verify changing time range updates all sparklines and area charts.

### Steps:

1. **Initial State:**
   - [ ] Open statistics view
   - [ ] Note current time range selection
   - [ ] Observe sparklines for multiple hosts

2. **Change Time Range:**
   - [ ] Select different time range from dropdown
   - [ ] Verify ALL sparklines update simultaneously
   - [ ] Verify no sparklines remain with old data
   - [ ] Verify update happens immediately (< 100ms)

3. **Test All Transitions:**
   - [ ] Change from 1 hour → 12 hours
   - [ ] Change from 12 hours → 24 hours
   - [ ] Change from 24 hours → 3 days
   - [ ] Change from 3 days → 7 days
   - [ ] Change from 7 days → 30 days
   - [ ] Change from 30 days → 1 hour
   - [ ] Verify each transition updates all sparklines

4. **Test Area Chart Consistency:**
   - [ ] Select a time range (e.g., 7 days)
   - [ ] Click a sparkline to open area chart
   - [ ] Verify area chart shows same time range
   - [ ] Close modal
   - [ ] Change time range (e.g., to 24 hours)
   - [ ] Click same sparkline again
   - [ ] Verify area chart now shows 24 hours data

5. **Verify Data Consistency:**
   - [ ] For each time range, verify sparkline and area chart show same data
   - [ ] Verify bucket counts match between sparkline and area chart
   - [ ] Verify total counts remain consistent

**Expected Results:**
- ✅ All sparklines update when time range changes
- ✅ Updates happen immediately and simultaneously
- ✅ Area charts reflect current time range selection
- ✅ Data consistency between sparklines and area charts
- ✅ No visual glitches during updates

---

## Test 7: Clear Host Removes Datapoints

**Objective:** Verify clearing individual host statistics works correctly.

### Steps:

1. **Setup:**
   - [ ] Ensure multiple hosts have usage data
   - [ ] Note counts for at least 3 hosts
   - [ ] Open statistics view

2. **Clear Single Host:**
   - [ ] Click "Clear" button for one host
   - [ ] Verify host immediately removed from statistics list
   - [ ] Verify other hosts remain unchanged

3. **Verify Badge Update:**
   - [ ] Open search window
   - [ ] Find the cleared host
   - [ ] Verify badge shows 0
   - [ ] Verify badge color is gray
   - [ ] Verify other host badges unchanged

4. **Verify Top 10 Update:**
   - [ ] With empty search, verify top 10 list updated
   - [ ] Verify cleared host moved down in ranking
   - [ ] Verify other hosts maintain positions

5. **Verify Persistence:**
   - [ ] Close statistics window
   - [ ] Reopen statistics window
   - [ ] Verify cleared host still not in list
   - [ ] Verify cleared host badge still shows 0

6. **Test Multiple Clears:**
   - [ ] Clear 2 more hosts
   - [ ] Verify each removal works independently
   - [ ] Verify remaining hosts unaffected

**Expected Results:**
- ✅ Clear button removes host from statistics
- ✅ Removal happens immediately
- ✅ Badge updates to 0 in search window
- ✅ Top 10 list updates accordingly
- ✅ Changes persist across window close/open
- ✅ Other hosts remain unaffected

---

## Test 8: Clear All Removes All Datapoints

**Objective:** Verify clearing all statistics works correctly with confirmation.

### Steps:

1. **Setup:**
   - [ ] Ensure multiple hosts have usage data
   - [ ] Note total number of hosts with data
   - [ ] Open statistics view

2. **Initiate Clear All:**
   - [ ] Click "Clear All Statistics" button
   - [ ] Verify confirmation modal appears

3. **Verify Confirmation Modal:**
   - [ ] Modal displays warning message
   - [ ] Message: "Are you sure you want to clear all usage statistics? This cannot be undone."
   - [ ] Modal has "Cancel" button
   - [ ] Modal has "Clear All" button (red)

4. **Test Cancel:**
   - [ ] Click "Cancel" button
   - [ ] Verify modal closes
   - [ ] Verify statistics remain unchanged
   - [ ] Verify all hosts still in list

5. **Test Clear All:**
   - [ ] Click "Clear All Statistics" button again
   - [ ] Click "Clear All" button in modal
   - [ ] Verify modal closes
   - [ ] Verify statistics list becomes empty
   - [ ] Verify "Clear All Statistics" button still visible

6. **Verify Badge Updates:**
   - [ ] Open search window
   - [ ] Verify ALL badges show 0
   - [ ] Verify ALL badges are gray color
   - [ ] Check multiple ingresses to confirm

7. **Verify Top 10 Reset:**
   - [ ] With empty search, verify no usage-based sorting
   - [ ] Verify ingresses in default order
   - [ ] Click an ingress URL
   - [ ] Verify top 10 sorting resumes with new data

8. **Verify Persistence:**
   - [ ] Close and reopen statistics window
   - [ ] Verify statistics still empty
   - [ ] Restart application
   - [ ] Verify statistics still empty

**Expected Results:**
- ✅ Confirmation modal appears before clearing
- ✅ Cancel preserves all data
- ✅ Clear All removes all statistics
- ✅ All badges reset to 0
- ✅ Top 10 sorting resets
- ✅ Changes persist across restarts

---

## Test 9: Cleanup Removes Old Datapoints

**Objective:** Verify automatic cleanup removes datapoints older than 30 days.

### Steps:

**Note:** This test requires either:
- Waiting 30+ days with test data, OR
- Manually modifying storage file to inject old timestamps, OR
- Using time-travel testing if implemented

1. **Setup - Create Old Data (Manual Method):**
   - [ ] Stop application
   - [ ] Locate storage file: `~/Library/Application Support/com.kube-ingress-desktop.app/usage_stats.json`
   - [ ] Backup current file
   - [ ] Edit file to add datapoints with timestamps > 30 days old
   - [ ] Add mix of old (35 days) and recent (5 days) datapoints
   - [ ] Save file

2. **Trigger Cleanup:**
   - [ ] Start application
   - [ ] Wait for automatic refresh (or trigger manual refresh)
   - [ ] Check console logs for cleanup message

3. **Verify Cleanup Occurred:**
   - [ ] Check console for: "Cleaned up X old usage datapoints"
   - [ ] Verify X matches number of old datapoints
   - [ ] Open statistics view
   - [ ] Verify only recent datapoints remain
   - [ ] Verify counts reflect only recent opens

4. **Verify Cleanup Doesn't Break Refresh:**
   - [ ] Verify ingress list still loads
   - [ ] Verify no errors in console
   - [ ] Verify application continues working normally

5. **Verify Cleanup Persistence:**
   - [ ] Close application
   - [ ] Reopen application
   - [ ] Verify old datapoints still removed
   - [ ] Verify recent datapoints still present

**Expected Results:**
- ✅ Cleanup runs during refresh task
- ✅ Datapoints > 30 days removed
- ✅ Recent datapoints preserved
- ✅ Cleanup logged to console
- ✅ Application continues working after cleanup
- ✅ Changes persist across restarts

---

## Test 10: Statistics Persist Across Restarts

**Objective:** Verify usage statistics are saved and loaded correctly across application restarts.

### Steps:

1. **Create Usage Data:**
   - [ ] Start application
   - [ ] Open several ingress URLs (at least 5 different hosts)
   - [ ] Create varied usage pattern (different counts per host)
   - [ ] Note exact counts for each host

2. **Verify Initial State:**
   - [ ] Open statistics view
   - [ ] Verify all hosts and counts display correctly
   - [ ] Note order of hosts in statistics list

3. **Restart Application:**
   - [ ] Close application completely (Cmd+Q)
   - [ ] Wait 5 seconds
   - [ ] Restart application

4. **Verify Data Loaded:**
   - [ ] Open search window
   - [ ] Verify all badges show correct counts
   - [ ] Verify badge counts match pre-restart values
   - [ ] Open statistics view
   - [ ] Verify all hosts present with correct counts
   - [ ] Verify order matches pre-restart order

5. **Verify Top 10 Persists:**
   - [ ] With empty search, verify top 10 sorting
   - [ ] Verify same hosts in top 10 as before restart
   - [ ] Verify same order as before restart

6. **Test Multiple Restarts:**
   - [ ] Add more usage data
   - [ ] Restart application again
   - [ ] Verify cumulative data persists
   - [ ] Verify new data added to existing data

7. **Test After System Restart:**
   - [ ] Note current statistics
   - [ ] Restart computer
   - [ ] Start application
   - [ ] Verify statistics still present and correct

**Expected Results:**
- ✅ All usage data persists across app restarts
- ✅ Badge counts remain accurate
- ✅ Statistics view shows correct data
- ✅ Top 10 sorting persists
- ✅ Data survives system restarts
- ✅ No data loss occurs

---

## Test 11: Window State Persists Across Sessions

**Objective:** Verify statistics window size and position are saved and restored.

### Steps:

1. **Initial Window State:**
   - [ ] Open statistics window
   - [ ] Note default size and position
   - [ ] Note if window is centered

2. **Modify Window:**
   - [ ] Resize window to custom size (e.g., 1000x700)
   - [ ] Move window to specific position (e.g., top-right corner)
   - [ ] Note exact size and position

3. **Close and Reopen:**
   - [ ] Close statistics window
   - [ ] Reopen statistics window from menu
   - [ ] Verify window opens at saved position
   - [ ] Verify window has saved size

4. **Test Multiple Changes:**
   - [ ] Resize to different size
   - [ ] Move to different position
   - [ ] Close and reopen
   - [ ] Verify new size and position restored

5. **Test Across App Restarts:**
   - [ ] Set custom window size and position
   - [ ] Close statistics window
   - [ ] Close application (Cmd+Q)
   - [ ] Restart application
   - [ ] Open statistics window
   - [ ] Verify size and position restored

6. **Test Minimum Size:**
   - [ ] Try to resize window smaller than 600x400
   - [ ] Verify minimum size enforced
   - [ ] Close and reopen
   - [ ] Verify minimum size still enforced

**Expected Results:**
- ✅ Window size persists across close/open
- ✅ Window position persists across close/open
- ✅ Window state persists across app restarts
- ✅ Minimum size constraints enforced
- ✅ Window state saves automatically

---

## Test 12: Theme Applies to Statistics Window

**Objective:** Verify theme settings apply correctly to statistics window.

### Steps:

1. **Test Light Theme:**
   - [ ] Open settings (if available) or check current theme
   - [ ] Set theme to "Light"
   - [ ] Open statistics window
   - [ ] Verify light theme applied:
     - Light background colors
     - Dark text colors
     - Appropriate contrast
   - [ ] Verify sparklines visible in light theme
   - [ ] Open area chart modal
   - [ ] Verify modal uses light theme

2. **Test Dark Theme:**
   - [ ] Change theme to "Dark"
   - [ ] Verify statistics window updates immediately
   - [ ] Verify dark theme applied:
     - Dark background colors
     - Light text colors
     - Appropriate contrast
   - [ ] Verify sparklines visible in dark theme
   - [ ] Open area chart modal
   - [ ] Verify modal uses dark theme

3. **Test System Theme:**
   - [ ] Change theme to "System"
   - [ ] Verify statistics window matches system theme
   - [ ] Change system theme (macOS: System Preferences)
   - [ ] Verify statistics window updates automatically

4. **Test Theme Consistency:**
   - [ ] Open both search window and statistics window
   - [ ] Verify both windows use same theme
   - [ ] Change theme
   - [ ] Verify both windows update together

5. **Test Theme Persistence:**
   - [ ] Set specific theme
   - [ ] Close statistics window
   - [ ] Restart application
   - [ ] Open statistics window
   - [ ] Verify theme setting persisted

**Expected Results:**
- ✅ Light theme displays correctly
- ✅ Dark theme displays correctly
- ✅ System theme follows OS settings
- ✅ Theme changes apply immediately
- ✅ All windows use consistent theme
- ✅ Theme preference persists

---

## Test 13: Error Handling for Storage Failures

**Objective:** Verify application handles storage errors gracefully without crashing.

### Steps:

**Note:** These tests require simulating storage failures, which may require:
- File permission changes
- Disk full simulation
- File corruption

1. **Test Load Failure:**
   - [ ] Stop application
   - [ ] Corrupt storage file (invalid JSON)
   - [ ] Start application
   - [ ] Verify application starts successfully
   - [ ] Verify no crash occurs
   - [ ] Check console for error log
   - [ ] Verify application initializes with empty statistics
   - [ ] Verify new usage can be recorded

2. **Test Write Failure:**
   - [ ] Make storage directory read-only
   - [ ] Open ingress URL to record usage
   - [ ] Verify application doesn't crash
   - [ ] Check console for error log
   - [ ] Verify application continues working
   - [ ] Restore write permissions
   - [ ] Verify usage recording resumes

3. **Test Missing Storage File:**
   - [ ] Stop application
   - [ ] Delete storage file
   - [ ] Start application
   - [ ] Verify application starts successfully
   - [ ] Verify initializes with empty statistics
   - [ ] Record some usage
   - [ ] Verify new storage file created

4. **Test Cleanup Failure:**
   - [ ] Simulate cleanup failure (if possible)
   - [ ] Trigger refresh
   - [ ] Verify refresh continues despite cleanup error
   - [ ] Verify ingress list still updates
   - [ ] Check console for error log

5. **Test Statistics View Errors:**
   - [ ] Simulate data fetch failure
   - [ ] Open statistics view
   - [ ] Verify error message displayed (not crash)
   - [ ] Verify retry option available
   - [ ] Verify application remains responsive

**Expected Results:**
- ✅ Load failures don't crash application
- ✅ Write failures logged but don't crash
- ✅ Missing files handled gracefully
- ✅ Cleanup failures don't stop refresh
- ✅ UI displays error messages appropriately
- ✅ Application remains functional after errors
- ✅ Errors logged to console

---

## Summary Checklist

After completing all tests above, verify:

- [ ] All 13 test sections completed
- [ ] All individual test items passed
- [ ] No crashes or hangs encountered
- [ ] No console errors (except expected error handling tests)
- [ ] Application remains responsive throughout testing
- [ ] All features work as specified in requirements
- [ ] Data persistence verified
- [ ] Error handling verified
- [ ] Performance acceptable (no lag or delays)

## Test Results

**Date Tested:** _______________

**Tester:** _______________

**Application Version:** _______________

**Test Environment:**
- OS: macOS _______________
- Kubernetes Cluster: _______________
- Number of Ingresses: _______________

**Overall Result:** ⬜ PASS / ⬜ FAIL

**Notes:**
```

