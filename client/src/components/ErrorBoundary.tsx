import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#000",
          color: "#fff",
          fontFamily: "system-ui",
          padding: "20px",
        }}>
          <div style={{ textAlign: "center", maxWidth: "500px" }}>
            <h1 style={{ color: "#ff453a", marginBottom: "20px", fontSize: "24px" }}>Something went wrong</h1>
            <p style={{ marginBottom: "20px", color: "#8E8E93" }}>
              The app encountered an error. Please refresh the page.
            </p>
            {this.state.error && (
              <pre style={{
                color: "#ff453a",
                marginTop: "20px",
                fontSize: "12px",
                textAlign: "left",
                background: "#1C1C1E",
                padding: "15px",
                borderRadius: "8px",
                overflow: "auto",
                maxHeight: "200px",
              }}>
                {this.state.error.message}
                {this.state.error.stack && `\n\n${this.state.error.stack}`}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "20px",
                padding: "12px 24px",
                background: "#0A84FF",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

