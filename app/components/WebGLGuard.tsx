"use client";

import { Component, type ReactNode } from "react";

class CanvasErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    // Swallow WebGL creation errors — fallback UI is rendered instead.
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Renders Three.js children behind an error boundary. If the WebGL context
 * cannot be created (no GPU, WebGL disabled, context limits), the Canvas
 * throws during mount — the boundary catches it and renders `fallback`
 * instead, so the page never crashes and degrades to 2D visuals.
 */
export default function WebGLGuard({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <CanvasErrorBoundary fallback={fallback}>{children}</CanvasErrorBoundary>;
}
