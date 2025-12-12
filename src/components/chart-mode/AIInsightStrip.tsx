'use client'

import { useState, useEffect } from 'react'
import {
  Sparkles,
  X,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  Pill,
  FlaskConical,
  Phone,
  FileText,
  Droplets,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface AIInsight {
  id: string
  type: 'alert' | 'trend' | 'suggestion' | 'reminder'
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
  actions: Array<{
    label: string
    icon?: React.ComponentType<{ className?: string }>
    action: () => void
    primary?: boolean
  }>
  timestamp: Date
}

interface AIInsightStripProps {
  patientId: string
  insights: AIInsight[]
  onDismiss: (id: string) => void
  onFeedback: (id: string, helpful: boolean) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

const typeIcons = {
  alert: AlertTriangle,
  trend: TrendingUp,
  suggestion: Sparkles,
  reminder: FileText,
}

const severityStyles = {
  critical: {
    bg: 'bg-red-600',
    text: 'text-white',
    iconBg: 'bg-red-700',
  },
  warning: {
    bg: 'bg-amber-500',
    text: 'text-white',
    iconBg: 'bg-amber-600',
  },
  info: {
    bg: 'bg-blue-600',
    text: 'text-white',
    iconBg: 'bg-blue-700',
  },
}

export function AIInsightStrip({
  patientId,
  insights,
  onDismiss,
  onFeedback,
  isCollapsed = false,
  onToggleCollapse,
}: AIInsightStripProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showFeedback, setShowFeedback] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Auto-rotate through insights if multiple
  useEffect(() => {
    if (insights.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % insights.length)
    }, 10000) // Rotate every 10 seconds

    return () => clearInterval(interval)
  }, [insights.length])

  const currentInsight = insights[currentIndex]

  if (!currentInsight || isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform z-40"
      >
        <Sparkles className="h-6 w-6" />
        {insights.length > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
            {insights.length}
          </span>
        )}
      </button>
    )
  }

  const TypeIcon = typeIcons[currentInsight.type]
  const styles = severityStyles[currentInsight.severity]

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsRefreshing(false)
  }

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-40 shadow-lg",
      styles.bg, styles.text
    )}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={cn("h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0", styles.iconBg)}>
            <Sparkles className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <TypeIcon className="h-4 w-4" />
              <span className="text-sm font-semibold">{currentInsight.title}</span>
            </div>
            <p className="text-sm opacity-90 truncate">{currentInsight.message}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {currentInsight.actions.map((action, i) => {
              const ActionIcon = action.icon
              return (
                <Button
                  key={i}
                  size="sm"
                  variant={action.primary ? 'secondary' : 'ghost'}
                  className={cn(
                    "text-xs",
                    !action.primary && "text-white/90 hover:text-white hover:bg-white/10"
                  )}
                  onClick={action.action}
                >
                  {ActionIcon && <ActionIcon className="h-4 w-4 mr-1" />}
                  {action.label}
                </Button>
              )
            })}
          </div>

          {/* Feedback */}
          {showFeedback === currentInsight.id ? (
            <div className="flex items-center gap-1 px-2">
              <span className="text-xs opacity-75 mr-1">Helpful?</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-white/75 hover:text-white hover:bg-white/10"
                onClick={() => {
                  onFeedback(currentInsight.id, true)
                  setShowFeedback(null)
                }}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-white/75 hover:text-white hover:bg-white/10"
                onClick={() => {
                  onFeedback(currentInsight.id, false)
                  setShowFeedback(null)
                }}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="text-white/75 hover:text-white hover:bg-white/10"
              onClick={() => setShowFeedback(currentInsight.id)}
            >
              Feedback
            </Button>
          )}

          {/* Navigation dots (if multiple insights) */}
          {insights.length > 1 && (
            <div className="flex items-center gap-1 px-2">
              {insights.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    i === currentIndex ? "bg-white" : "bg-white/40 hover:bg-white/60"
                  )}
                />
              ))}
            </div>
          )}

          {/* Refresh */}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-white/75 hover:text-white hover:bg-white/10"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>

          {/* Dismiss */}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-white/75 hover:text-white hover:bg-white/10"
            onClick={() => onDismiss(currentInsight.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Sample insights generator (in production, this would come from AI backend)
export function generateSampleInsights(patient: {
  name: string
  keyLabs?: Array<{ name: string; value: string; status: string }>
}): AIInsight[] {
  return [
    {
      id: '1',
      type: 'trend',
      severity: 'warning',
      title: 'Creatinine Trending Up',
      message: `Cr increased 33% in 48h (1.8→2.4). Consider AKI Stage 2 workup.`,
      actions: [
        { label: 'I/O Review', icon: Droplets, action: () => {}, primary: true },
        { label: 'Med Review', icon: Pill, action: () => {} },
        { label: 'Page Nephro', icon: Phone, action: () => {} },
      ],
      timestamp: new Date(),
    },
    {
      id: '2',
      type: 'suggestion',
      severity: 'info',
      title: 'Documentation Reminder',
      message: 'Progress note not yet documented for today. Templates available.',
      actions: [
        { label: 'Start Note', icon: FileText, action: () => {}, primary: true },
      ],
      timestamp: new Date(Date.now() - 30 * 60000),
    },
    {
      id: '3',
      type: 'alert',
      severity: 'critical',
      title: 'Drug Interaction Alert',
      message: 'Potential interaction: Warfarin + Aspirin increases bleeding risk.',
      actions: [
        { label: 'Review', action: () => {}, primary: true },
        { label: 'Override', action: () => {} },
      ],
      timestamp: new Date(Date.now() - 60 * 60000),
    },
  ]
}

