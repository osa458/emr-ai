'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Zap, Clock, CheckCircle, ChevronRight } from 'lucide-react'

interface QuickWin {
  action: string
  rationale: string
  priority: 'high' | 'medium' | 'low'
  timeToComplete: string
  patientId?: string
  patientName?: string
}

interface QuickWinsListProps {
  wins: QuickWin[]
  onComplete?: (index: number) => void
  maxItems?: number
}

export function QuickWinsList({ wins, onComplete, maxItems = 10 }: QuickWinsListProps) {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          badgeClass: 'bg-red-100 text-red-800 border-red-300',
          bgClass: 'bg-red-50',
        }
      case 'medium':
        return {
          badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          bgClass: 'bg-yellow-50',
        }
      case 'low':
        return {
          badgeClass: 'bg-green-100 text-green-800 border-green-300',
          bgClass: 'bg-green-50',
        }
      default:
        return {
          badgeClass: 'bg-gray-100 text-gray-800 border-gray-300',
          bgClass: 'bg-gray-50',
        }
    }
  }

  const displayWins = wins.slice(0, maxItems)

  if (displayWins.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Wins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No quick wins identified at this time.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Wins
          </CardTitle>
          <Badge variant="secondary">{wins.length} actions</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayWins.map((win, idx) => {
            const config = getPriorityConfig(win.priority)
            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${config.bgClass}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{win.action}</span>
                      <Badge variant="outline" className={config.badgeClass}>
                        {win.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {win.rationale}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {win.timeToComplete}
                      </span>
                      {win.patientName && (
                        <span className="flex items-center gap-1">
                          <ChevronRight className="h-3 w-3" />
                          {win.patientName}
                        </span>
                      )}
                    </div>
                  </div>
                  {onComplete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onComplete(idx)}
                      className="flex-shrink-0"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
