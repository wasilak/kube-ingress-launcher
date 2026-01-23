import { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Stack, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary component for catching and handling route rendering errors.
 * Displays a user-friendly error message with a button to return to the home route.
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4
 */
export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Update state when an error is caught
   * Requirement 14.1: Implement error boundary for route components
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * Log errors to console for debugging
   * Requirement 14.4: Log routing errors for debugging
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Route rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Stack gap="md" p="md">
          <Alert color="red" icon={<IconAlertCircle />} title="Something went wrong">
            <Text size="sm" mb="md">
              {this.state.error?.message || 'An unexpected error occurred while rendering this page.'}
            </Text>
            {/* Requirement 14.3: Provide a way to return to the home route */}
            <Button component={Link} to="/" variant="light">
              Return to Home
            </Button>
          </Alert>
        </Stack>
      );
    }

    return this.props.children;
  }
}
