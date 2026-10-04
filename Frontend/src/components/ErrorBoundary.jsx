import { Component } from "react";

/** Last line of defence: a calm recovery screen instead of a blank page. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("[Novix] UI error:", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <div className="glass-strong max-w-md rounded-3xl p-8 text-center">
          <h1 className="font-display text-xl font-bold text-mist-100">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-mist-400">
            The page hit an unexpected problem. Your answers are safe on the server. Reload to continue.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
              Reload
            </button>
            <button
              type="button"
              className="btn-glass"
              onClick={() => {
                try {
                  sessionStorage.clear();
                } catch {
                  /* ignore */
                }
                window.location.assign("/");
              }}
            >
              Start over
            </button>
          </div>
        </div>
      </div>
    );
  }
}
