import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center p-4 border border-destructive rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="h-8 w-8 mb-2" />
          <h2 className="text-lg font-semibold mb-2">Algo salió mal</h2>
          <p className="text-sm text-center">
            {this.state.error?.message || 'Ha ocurrido un error inesperado'}
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
