import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  name: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that confines a crash to one dashboard sub-panel rather than
 * tearing down the entire app.
 */
export class PanelBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`[PanelBoundary] Error in panel "${this.props.name}":`, error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-stone-900/90 border border-rose-900/60 font-mono text-stone-300 space-y-4">
          <div className="flex items-center gap-3 text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="font-bold text-base">Panel crashed: {this.props.name}</h3>
          </div>
          <p className="text-xs text-stone-400 font-sans">
            An unexpected error occurred while rendering this panel. The rest of the dashboard remains operational.
          </p>
          {this.state.error && (
            <pre className="p-3 bg-stone-950 border border-stone-800 text-rose-300 text-xs overflow-x-auto whitespace-pre-wrap font-mono">
              {this.state.error.message || String(this.state.error)}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Reloading Panel</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
