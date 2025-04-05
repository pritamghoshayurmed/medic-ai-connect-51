import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card className="my-4">
          <CardHeader className="bg-red-50 text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-lg font-medium">Something went wrong</h3>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-2">
              {this.state.error && this.state.error.toString()}
            </div>
            <details className="text-xs text-gray-500 mt-2">
              <summary>Error details</summary>
              <pre className="mt-2 max-h-40 overflow-auto p-2 bg-gray-100 rounded text-xs">
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          </CardContent>
          <CardFooter className="bg-gray-50 p-3">
            <Button
              variant="outline"
              onClick={this.resetError}
              className="mr-2"
            >
              Try Again
            </Button>
            <Button
              variant="default"
              onClick={() => window.location.href = '/'}
            >
              Go to Home
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 