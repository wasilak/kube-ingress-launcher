/**
 * StatisticsView wrapper component - Route-based statistics view
 * 
 * This is a thin wrapper around the existing StatisticsView component
 * that makes it accessible as a route instead of a modal.
 * 
 * Requirements: 5.1, 5.2
 */

import { StatisticsView as StatisticsContent } from '../components/StatisticsView';

/**
 * StatisticsView component for route-based access
 * 
 * This wrapper allows the statistics view to be accessed via routing
 * instead of through a modal dialog. It reuses the existing StatisticsView
 * component without the modal wrapper.
 * 
 * Requirements: 5.1, 5.2
 */
export function StatisticsView() {
  return <StatisticsContent />;
}
