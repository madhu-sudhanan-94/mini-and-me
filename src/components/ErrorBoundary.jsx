import React from "react";
import { BRAND } from "../brand.config.js";
import { panelBlue } from "../theme.js";

// Catches render/runtime errors anywhere below it so one bad component doesn't
// blank the whole app mid-shopping.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    // Hook a logging service (Sentry/GA) here later.
    if (typeof console !== "undefined") console.error("App error:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-dvh flex items-center justify-center p-6 font-sans" style={panelBlue}>
          <div className="bg-white rounded-3xl shadow-xl p-6 max-w-sm w-full text-center">
            <p className="text-2xl font-extrabold text-slate-900">Something went wrong</p>
            <p className="text-slate-500 text-sm mt-2">{BRAND.name} hit an unexpected error. Reloading usually fixes it.</p>
            <button onClick={() => window.location.reload()} className="mt-5 w-full bg-brand-600 text-white font-semibold py-3 rounded-xl">Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
