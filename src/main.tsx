/**
 * React application entry point
 * 
 * Sets up:
 * - React root rendering
 * - BrowserRouter for client-side routing
 * - MantineProvider for UI components with theme management
 * - Global styles
 * 
 * Requirements: 1.1, 1.2, 12.1, 17.1-17.12
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
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
 * - BrowserRouter for client-side routing
 * 
 * defaultColorScheme is set to 'auto' to follow system preference by default
 * The useTheme hook in App will load the user's saved preference and update it
 * 
 * BrowserRouter provides HTML5 history API-based routing, suitable for desktop applications.
 * Wrapping at the root level ensures routing context is available throughout the app.
 * 
 * Requirements: 1.1, 1.2, 12.1, 17.1-17.12
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MantineProvider>
  </React.StrictMode>
);
