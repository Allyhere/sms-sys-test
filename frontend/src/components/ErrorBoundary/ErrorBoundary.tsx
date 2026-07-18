import { Component } from "react";
import type { ErrorInfo } from "./ErrorBoundary.types";
import type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
} from "./ErrorBoundary.types";

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            className="mx-auto mt-8 max-w-md rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
            role="alert"
          >
            Something went wrong. Try refreshing the page.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
