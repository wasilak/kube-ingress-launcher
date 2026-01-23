/**
 * Statistics page component
 * 
 * This page is rendered in the statistics window and displays
 * the StatisticsView component with theme support.
 * 
 * Requirements: 4.2, 15.3
 */

import { StatisticsView } from '../components/StatisticsView';

/**
 * Statistics page
 * 
 * Renders the StatisticsView component for the statistics window.
 * Theme is applied via the MantineProvider in main.tsx.
 * 
 * Requirements: 4.2, 15.3
 */
export function Statistics() {
  return <StatisticsView />;
}
