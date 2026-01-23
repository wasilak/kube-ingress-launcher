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
import { createTheme } from '@mantine/core';
import App from './App';
import './styles/index.css';
import '@mantine/core/styles.css';
import { ThemeProvider } from './components/ThemeProvider';

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
 * - ThemeProvider for theme management
 * - MantineProvider for UI component theming
 * 
 * Requirements: 12.1, 17.1-17.12
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
