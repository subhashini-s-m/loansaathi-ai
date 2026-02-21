/**
 * Error Boundary Component
 * Catches React errors and displays fallback UI with recovery options
 */

import React, { ReactNode, Component, ReactElement } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactElement;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

/**
 * Error Boundary - catches React rendering errors
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorCount: 1 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details for debugging
    console.error('[ErrorBoundary] Caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Increment error count
    this.setState(prev => ({
      errorCount: prev.errorCount + 1,
    }));

    // Track in external service if needed
    // trackErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    console.info('[ErrorBoundary] Attempting recovery');
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // If too many errors, force reload
      if (this.state.errorCount > 3) {
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Critical Error</h2>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Multiple errors detected. Please reload the application.
            </p>
            <Button
              onClick={this.handleReload}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
            >
              <RefreshCw size={18} />
              Reload Application
            </Button>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
          <Alert className="max-w-md mb-6 border-orange-300 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="font-semibold mb-2">Oops! Something went wrong</div>
              <p className="text-sm mb-3">{this.state.error.message}</p>
              <p className="text-xs text-orange-700">Error #: {this.state.errorCount}</p>
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              onClick={this.handleReset}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
            >
              <RefreshCw size={18} />
              Try Again
            </Button>
            <Button
              onClick={this.handleGoHome}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home size={18} />
              Go Home
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-8 p-4 bg-gray-100 rounded w-full max-w-md cursor-pointer">
              <summary className="font-mono text-sm font-semibold text-gray-700">
                Debug Info
              </summary>
              <pre className="mt-2 text-xs overflow-auto text-gray-600 whitespace-pre-wrap break-words">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
