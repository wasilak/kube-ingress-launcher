/**
 * React application entry point
 * 
 * Sets up:
 * - React root rendering
 * - MantineProvider for UI components (theme applied in App)
 * - Global styles
 * 
 * Requirements: 12.1
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import App from './App';
import './styles/index.css';
import '@mantine/core/styles.css';

/**
 * Mantine theme configuration
 * 
 * Configures theme for integration with macOS vibrancy
 * Color scheme is managed by useTheme hook in App component
 */
const theme = createTheme({
  /** Default spacing and sizing */
  defaultRadius: 'md',
  
  /** Font configuration */
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
});

/**
 * Render the React application
 * 
 * Wraps the App component with:
 * - React.StrictMode for development checks
 * - MantineProvider for UI component theming
 * 
 * Note: Color scheme is managed by useTheme hook in App component
 * 
 * Requirements: 12.1, 17.1-17.12
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>
  </React.StrictMode>
);
