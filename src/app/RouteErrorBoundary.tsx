import { Alert, Anchor } from '@mantine/core';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  failed: boolean;
}

/** Shows a message instead of a blank page when a screen throws (NFR Design §3.4). */
export class RouteErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Screen failed to render', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Alert color="red" title="Something went wrong">
        This screen failed to display. <Anchor href={window.location.href}>Reload the page</Anchor>
      </Alert>
    );
  }
}
