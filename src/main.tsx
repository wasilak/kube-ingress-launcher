/**
 * React application entry point
 * 
 * Sets up:
 * - React root rendering
 * - MantineProvider for UI components with theme management
 * - Global styles
 * 
 * Requirements: 12.1, 17.1-17.12
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
 * defaultColorScheme is set to 'auto' to follow system preference by default
 * The useTheme hook in App will load the user's saved preference and update it
 * 
 * Requirements: 12.1, 17.1-17.12
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <App />
    </MantineProvider>
  </React.StrictMode>
);
