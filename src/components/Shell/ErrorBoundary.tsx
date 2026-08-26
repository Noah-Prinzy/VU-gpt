import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  /** Called with the caught error — use this to log/report, not to render. */
  onError?: (error: Error, info: ErrorInfo) => void
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * React only has one mechanism for "don't let a crash anywhere in this
 * subtree take down the whole app": a class component implementing
 * getDerivedStateFromError. Without one *anywhere* in the tree (there
 * wasn't one before this), any uncaught render/effect error — a bad GLTF
 * load, a WebGL context loss, anything — unmounts the entire app and
 * leaves a blank page with nothing in the DOM to even show what happened.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] caught', error, info.componentStack)
    this.props.onError?.(error, info)
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return typeof this.props.fallback === 'function' ? this.props.fallback(error, this.reset) : this.props.fallback
  }
}
