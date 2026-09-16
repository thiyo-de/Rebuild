import React, { ReactNode } from 'react';
import { resetToStarterDefaults } from '../services/storage';

interface ErrorInfo {
  componentStack?: string | null;
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends (React.Component as new (props: Props) => {
  props: Props;
  state: State;
  setState: (state: Partial<State> | ((prevState: State) => Partial<State>)) => void;
}) {
  public state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('REBUILD — Uncaught Application Error:', error, errorInfo);
    this.setState({ errorInfo });
    const win = window as any;
    win.__REBUILD_LAST_ERROR__ = {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
    };
  }

  private handleReset = () => {
    try {
      resetToStarterDefaults();
      window.location.reload();
    } catch (e) {
      console.error('Failed to reset defaults:', e);
      localStorage.clear();
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#090D16',
            color: '#F8FAFC',
            fontFamily: 'Satoshi, -apple-system, sans-serif',
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: '#0F172A',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#EF4444',
                  fontSize: '20px',
                  fontWeight: 'bold',
                }}
              >
                !
              </div>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#FFFFFF' }}>
                  REBUILD — Runtime Recovery
                </h1>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0 0' }}>
                  An unexpected UI exception was safely contained.
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '20px',
                border: '1px solid rgba(51, 65, 85, 0.5)',
                maxHeight: '160px',
                overflowY: 'auto',
              }}
            >
              <code
                style={{
                  fontSize: '11px',
                  color: '#FCA5A5',
                  wordBreak: 'break-word',
                  fontFamily: 'monospace',
                  display: 'block',
                }}
              >
                {this.state.error?.toString() || 'Unknown runtime error'}
              </code>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={this.handleReload}
                style={{
                  minHeight: '48px',
                  width: '100%',
                  backgroundColor: '#6366F1',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Reload Application
              </button>

              <button
                onClick={this.handleReset}
                style={{
                  minHeight: '48px',
                  width: '100%',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#FCA5A5',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  borderRadius: '16px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Reset to Clean Slate Defaults
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
