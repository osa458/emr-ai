'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react'

interface ReadinessCardProps {
  readinessLevel: 'READY_TODAY' | 'READY_SOON' | 'NOT_READY'
  readinessScore: number
  readinessReasons: string[]
  estimatedDischargeDate?: string
  dischargeDisposition?: string
}

export function ReadinessCard({
  readinessLevel,
  readinessScore,
  readinessReasons,
  estimatedDischargeDate,
  dischargeDisposition,
}: ReadinessCardProps) {
  const getStatusConfig = () => {
    switch (readinessLevel) {
      case 'READY_TODAY':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          badgeClass: 'bg-green-100 text-green-800 border-green-300',
          label: 'Ready for Discharge',
          progressColor: 'bg-green-500',
        }
      case 'READY_SOON':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          label: 'Ready Soon (1-2 days)',
          progressColor: 'bg-yellow-500',
        }
      case 'NOT_READY':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          badgeClass: 'bg-red-100 text-red-800 border-red-300',
          label: 'Not Ready',
          progressColor: 'bg-red-500',
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className={`h-6 w-6 ${config.color}`} />
            <span>Discharge Readiness</span>
          </CardTitle>
          <Badge className={config.badgeClass}>{config.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Readiness Score</span>
            <span className="text-lg font-bold">{readinessScore}%</span>
          </div>
          <Progress value={readinessScore} className="h-3" />
        </div>

        {readinessReasons.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Key Factors:</h4>
            <ul className="space-y-1">
              {readinessReasons.slice(0, 4).map((reason, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          {estimatedDischargeDate && (
            <div>
              <span className="text-xs text-muted-foreground">Est. Discharge</span>
              <p className="text-sm font-medium">{estimatedDischargeDate}</p>
            </div>
          )}
          {dischargeDisposition && (
            <div>
              <span className="text-xs text-muted-foreground">Disposition</span>
              <p className="text-sm font-medium capitalize">
                {dischargeDisposition.replace(/_/g, ' ')}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
