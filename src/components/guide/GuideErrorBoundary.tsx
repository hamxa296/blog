import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class GuideErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Freshman Guide render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-[calc(100vh-88px)] relative z-10 pt-8 pb-16 px-4 flex items-center justify-center">
          <div className="max-w-md w-full bg-[#0A1931] border border-[#4A7FA7] rounded-xl p-8 text-center">
            <p className="text-4xl mb-4">⚠️</p>
            <h2 className="text-xl font-bold text-[#B3CFE5] mb-2">Something went wrong</h2>
            <p className="text-sm text-[#B3CFE5] mb-6">
              The guide failed to load. Please refresh the page.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#4A7FA7] text-white rounded-lg hover:bg-[#1A3D63] font-semibold"
            >
              Refresh Page
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
