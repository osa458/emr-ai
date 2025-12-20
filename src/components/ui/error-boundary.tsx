'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
    children: ReactNode
    fallback?: ReactNode
    componentName?: string
    onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
    hasError: boolean
    error?: Error
}

/**
 * ErrorBoundary - Catches JavaScript errors in child components
 * 
 * Prevents the entire app from crashing when a single component fails.
 * Shows a friendly error message and allows retry.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`[ErrorBoundary${this.props.componentName ? `: ${this.props.componentName}` : ''}] Caught error:`, error, errorInfo)
        this.props.onError?.(error, errorInfo)
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <Card className="border-red-200 bg-red-50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-red-700">
                            <AlertCircle className="h-5 w-5" />
                            {this.props.componentName || 'Component'} Error
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-red-600 mb-3">
                            Something went wrong loading this section.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <pre className="text-xs bg-red-100 p-2 rounded mb-3 overflow-auto max-h-24">
                                {this.state.error.message}
                            </pre>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={this.handleRetry}
                            className="border-red-300 hover:bg-red-100"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            )
        }

        return this.props.children
    }
}

/**
 * withErrorBoundary - HOC to wrap a component with an error boundary
 */
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    componentName?: string
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary componentName={componentName}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        )
    }
}

/**
 * ChartPanelBoundary - Specialized error boundary for chart panels
 */
export function ChartPanelBoundary({
    children,
    panelName
}: {
    children: ReactNode
    panelName: string
}) {
    return (
        <ErrorBoundary
            componentName={panelName}
            fallback={
                <div className="p-8 text-center text-muted-foreground border rounded-lg">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">{panelName} unavailable</p>
                    <p className="text-sm">Please refresh the page or try again later.</p>
                </div>
            }
        >
            {children}
        </ErrorBoundary>
    )
}

export default ErrorBoundary
