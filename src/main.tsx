/**
 * React application entry point
 * 
 * Sets up:
 * - React root rendering
 * - MantineProvider for UI components
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
 * Configures dark theme for better integration with macOS vibrancy
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
 * Requirements: 12.1
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <App />
    </MantineProvider>
  </React.StrictMode>
);
