'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Pill, GraduationCap, Home, HeartPulse } from 'lucide-react'

interface SafetyCheck {
  item: string
  category: 'medication' | 'education' | 'equipment' | 'safety' | 'social'
  completed: boolean
  notes?: string
}

interface SafetyChecklistProps {
  checks: SafetyCheck[]
  onToggle?: (index: number, completed: boolean) => void
}

export function SafetyChecklist({ checks, onToggle }: SafetyChecklistProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medication':
        return Pill
      case 'education':
        return GraduationCap
      case 'equipment':
        return Home
      case 'safety':
        return HeartPulse
      case 'social':
        return Home
      default:
        return ShieldCheck
    }
  }

  const completedCount = checks.filter(c => c.completed).length
  const totalCount = checks.length
  const allComplete = completedCount === totalCount

  // Group by category
  const grouped = checks.reduce((acc, check, idx) => {
    const cat = check.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push({ ...check, originalIndex: idx })
    return acc
  }, {} as Record<string, Array<SafetyCheck & { originalIndex: number }>>)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Safety Checklist
          </CardTitle>
          <Badge variant={allComplete ? 'default' : 'secondary'}>
            {completedCount}/{totalCount} Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, items]) => {
            const Icon = getCategoryIcon(category)
            return (
              <div key={category}>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2 capitalize">
                  <Icon className="h-4 w-4" />
                  {category}
                </h4>
                <div className="space-y-2 ml-6">
                  {items.map((check) => (
                    <div
                      key={check.originalIndex}
                      className="flex items-start gap-3"
                    >
                      <input
                        type="checkbox"
                        id={`check-${check.originalIndex}`}
                        checked={check.completed}
                        onChange={(e) =>
                          onToggle?.(check.originalIndex, e.target.checked)
                        }
                        disabled={!onToggle}
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`check-${check.originalIndex}`}
                          className={`text-sm cursor-pointer ${
                            check.completed ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {check.item}
                        </label>
                        {check.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {check.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
