'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  Heart,
  Thermometer,
  Wind,
  Droplet,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'

interface Vital {
  name: string
  value: number
  unit: string
  icon: React.ComponentType<{ className?: string }>
  normalRange: { min: number; max: number }
  trend?: 'up' | 'down' | 'stable'
}

interface RealTimeVitalsProps {
  patientId: string
  refreshInterval?: number // in seconds
}

// Simulate real-time vital updates
function generateVitals(): Vital[] {
  return [
    {
      name: 'Heart Rate',
      value: 68 + Math.floor(Math.random() * 15),
      unit: 'bpm',
      icon: Heart,
      normalRange: { min: 60, max: 100 },
      trend: Math.random() > 0.5 ? 'stable' : Math.random() > 0.5 ? 'up' : 'down',
    },
    {
      name: 'Blood Pressure',
      value: 120 + Math.floor(Math.random() * 20),
      unit: 'mmHg',
      icon: Activity,
      normalRange: { min: 90, max: 140 },
      trend: 'stable',
    },
    {
      name: 'Temperature',
      value: 98.2 + Math.random() * 1.5,
      unit: '°F',
      icon: Thermometer,
      normalRange: { min: 97.8, max: 99.1 },
      trend: 'stable',
    },
    {
      name: 'Respiratory Rate',
      value: 14 + Math.floor(Math.random() * 6),
      unit: '/min',
      icon: Wind,
      normalRange: { min: 12, max: 20 },
      trend: 'stable',
    },
    {
      name: 'SpO2',
      value: 94 + Math.floor(Math.random() * 5),
      unit: '%',
      icon: Droplet,
      normalRange: { min: 95, max: 100 },
      trend: Math.random() > 0.7 ? 'up' : 'stable',
    },
  ]
}

function isAbnormal(vital: Vital): boolean {
  return vital.value < vital.normalRange.min || vital.value > vital.normalRange.max
}

function TrendIcon({ trend }: { trend?: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp className="h-3 w-3 text-green-500" />
  if (trend === 'down') return <TrendingDown className="h-3 w-3 text-red-500" />
  return <Minus className="h-3 w-3 text-gray-400" />
}

export function RealTimeVitals({
  patientId,
  refreshInterval = 30,
}: RealTimeVitalsProps) {
  const [vitals, setVitals] = useState<Vital[]>(generateVitals())
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isLive, setIsLive] = useState(true)

  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      setVitals(generateVitals())
      setLastUpdate(new Date())
    }, refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [isLive, refreshInterval])

  const abnormalCount = vitals.filter(isAbnormal).length

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Vital Signs
          </CardTitle>
          <div className="flex items-center gap-2">
            {abnormalCount > 0 && (
              <Badge className="bg-red-100 text-red-800">
                {abnormalCount} abnormal
              </Badge>
            )}
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                isLive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}
              />
              {isLive ? 'LIVE' : 'PAUSED'}
            </button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {vitals.map((vital) => {
            const Icon = vital.icon
            const abnormal = isAbnormal(vital)

            return (
              <div
                key={vital.name}
                className={`rounded-lg border p-3 ${
                  abnormal ? 'border-red-300 bg-red-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Icon
                    className={`h-4 w-4 ${
                      abnormal ? 'text-red-500' : 'text-blue-500'
                    }`}
                  />
                  <TrendIcon trend={vital.trend} />
                </div>
                <div
                  className={`text-2xl font-bold ${
                    abnormal ? 'text-red-700' : ''
                  }`}
                >
                  {vital.name === 'Temperature'
                    ? vital.value.toFixed(1)
                    : vital.value}
                </div>
                <div className="text-xs text-muted-foreground">
                  {vital.name}
                </div>
                <div className="text-xs text-muted-foreground">{vital.unit}</div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
