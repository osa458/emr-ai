'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface VitalReading {
  name: string
  value: number | string
  unit: string
  timestamp: string
  trend?: 'up' | 'down' | 'stable'
  isAbnormal?: boolean
  referenceRange?: { low: number; high: number }
}

interface VitalsChartProps {
  vitals: VitalReading[]
  showTrends?: boolean
}

export function VitalsChart({ vitals, showTrends = true }: VitalsChartProps) {
  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-blue-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  // Group vitals by type and get latest
  const latestVitals = vitals.reduce((acc, vital) => {
    if (!acc[vital.name] || new Date(vital.timestamp) > new Date(acc[vital.name].timestamp)) {
      acc[vital.name] = vital
    }
    return acc
  }, {} as Record<string, VitalReading>)

  const vitalsList = Object.values(latestVitals)

  if (vitalsList.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Vital Signs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No vitals recorded.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Vital Signs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {vitalsList.map((vital, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border ${
                vital.isAbnormal ? 'bg-red-50 border-red-200' : 'bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{vital.name}</span>
                {showTrends && getTrendIcon(vital.trend)}
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-bold ${vital.isAbnormal ? 'text-red-600' : ''}`}>
                  {vital.value}
                </span>
                <span className="text-sm text-muted-foreground">{vital.unit}</span>
              </div>
              {vital.referenceRange && (
                <div className="text-xs text-muted-foreground mt-1">
                  Ref: {vital.referenceRange.low}-{vital.referenceRange.high}
                </div>
              )}
              {vital.isAbnormal && (
                <Badge variant="destructive" className="mt-1 text-xs">
                  Abnormal
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
