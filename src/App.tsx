/**
 * Main App component for Kube Ingress Launcher
 * 
 * This component orchestrates the entire UI using React Router:
 * - Route-based navigation instead of modals
 * - Layout component with burger menu on all routes
 * - SearchView at root route
 * - StatisticsView at /statistics route
 * - SettingsView at /settings route
 * - Catch-all route for invalid paths
 * - Navigation event listener for backend menu actions
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 9.4
 */

import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { listen } from '@tauri-apps/api/event';
import { Layout } from './components/Layout';
import { SearchView } from './views/SearchView';
import { StatisticsView } from './views/StatisticsView';
import { SettingsView } from './views/SettingsView';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { useTheme } from './hooks/useTheme';

/**
 * Main application component
 * 
 * Features:
 * - Route-based navigation with React Router
 * - Nested routes with Layout component
 * - Index route (/) renders SearchView
 * - /statistics route renders StatisticsView
 * - /settings route renders SettingsView
 * - Catch-all route redirects to home
 * - Theme management (light/dark/system)
 * - Navigation event listener for backend menu actions
 * - Error boundary for route rendering errors
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 9.4, 14.1, 14.5
 */
export function App() {
  // Initialize theme (loads from settings and manages Mantine color scheme)
  useTheme();
  
  const navigate = useNavigate();
  
  // Listen for navigation events from backend (menu items)
  useEffect(() => {
    const unlisten = listen<string>('navigate', (event) => {
      try {
        navigate(event.payload);
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback to home on navigation error
        navigate('/');
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [navigate]);
  
  return (
    <RouteErrorBoundary>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<SearchView />} />
          <Route path="statistics" element={<StatisticsView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RouteErrorBoundary>
  );
}

export default App;
