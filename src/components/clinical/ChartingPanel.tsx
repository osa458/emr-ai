'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Activity, Heart, Thermometer, Wind, Droplets,
  TrendingUp, TrendingDown, Minus, Clock, Plus,
  AlertTriangle, CheckCircle, Sparkles, RefreshCw
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

export interface VitalReading {
  timestamp: Date
  type: 'bp' | 'hr' | 'rr' | 'temp' | 'spo2' | 'weight'
  value: number | { systolic: number; diastolic: number }
  unit: string
  isAbnormal?: boolean
}

export interface ChartingPanelProps {
  patientId: string
  vitals?: VitalReading[]
  onAddVitals?: () => void
  onRefresh?: () => void
  showTrends?: boolean
  showAIInsights?: boolean
  className?: string
}

// Mock vitals data
const generateMockVitals = (): VitalReading[] => {
  const vitals: VitalReading[] = []
  const now = Date.now()
  
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now - i * 60 * 60 * 1000)
    
    vitals.push({
      timestamp,
      type: 'bp',
      value: { systolic: 120 + Math.floor(Math.random() * 30), diastolic: 70 + Math.floor(Math.random() * 20) },
      unit: 'mmHg',
      isAbnormal: Math.random() > 0.8
    })
    
    vitals.push({
      timestamp,
      type: 'hr',
      value: 70 + Math.floor(Math.random() * 30),
      unit: 'bpm',
      isAbnormal: Math.random() > 0.9
    })
    
    vitals.push({
      timestamp,
      type: 'rr',
      value: 14 + Math.floor(Math.random() * 8),
      unit: '/min'
    })
    
    vitals.push({
      timestamp,
      type: 'temp',
      value: 97.5 + Math.random() * 2,
      unit: '°F',
      isAbnormal: Math.random() > 0.95
    })
    
    vitals.push({
      timestamp,
      type: 'spo2',
      value: 94 + Math.floor(Math.random() * 6),
      unit: '%',
      isAbnormal: Math.random() > 0.85
    })
  }
  
  return vitals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

const vitalConfig = {
  bp: { icon: Activity, label: 'Blood Pressure', color: '#ef4444', normalRange: { low: '90/60', high: '140/90' } },
  hr: { icon: Heart, label: 'Heart Rate', color: '#f97316', normalRange: { low: 60, high: 100 } },
  rr: { icon: Wind, label: 'Respiratory Rate', color: '#3b82f6', normalRange: { low: 12, high: 20 } },
  temp: { icon: Thermometer, label: 'Temperature', color: '#8b5cf6', normalRange: { low: 97.0, high: 99.5 } },
  spo2: { icon: Droplets, label: 'SpO2', color: '#06b6d4', normalRange: { low: 95, high: 100 } }
}

export function ChartingPanel({
  patientId,
  vitals = generateMockVitals(),
  onAddVitals,
  onRefresh,
  showTrends = true,
  showAIInsights = true,
  className = ''
}: ChartingPanelProps) {
  const [selectedVital, setSelectedVital] = useState<keyof typeof vitalConfig>('hr')
  const [timeRange, setTimeRange] = useState<'6h' | '12h' | '24h' | '48h'>('24h')

  // Get latest vitals
  const getLatestVital = (type: string) => {
    return vitals.find(v => v.type === type)
  }

  // Format vital value
  const formatValue = (reading: VitalReading) => {
    if (reading.type === 'bp' && typeof reading.value === 'object') {
      return `${reading.value.systolic}/${reading.value.diastolic}`
    }
    if (reading.type === 'temp') {
      return (reading.value as number).toFixed(1)
    }
    return String(reading.value)
  }

  // Get trend for vital
  const getTrend = (type: string) => {
    const typeVitals = vitals.filter(v => v.type === type).slice(0, 3)
    if (typeVitals.length < 2) return 'stable'
    
    const getValue = (v: VitalReading) => {
      if (typeof v.value === 'object') return v.value.systolic
      return v.value as number
    }
    
    const recent = getValue(typeVitals[0])
    const previous = getValue(typeVitals[1])
    const diff = ((recent - previous) / previous) * 100
    
    if (diff > 5) return 'up'
    if (diff < -5) return 'down'
    return 'stable'
  }

  // Prepare chart data
  const getChartData = () => {
    const hours = parseInt(timeRange)
    const cutoff = Date.now() - hours * 60 * 60 * 1000
    
    return vitals
      .filter(v => v.type === selectedVital && v.timestamp.getTime() > cutoff)
      .map(v => ({
        time: v.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        value: typeof v.value === 'object' ? v.value.systolic : v.value,
        diastolic: typeof v.value === 'object' ? v.value.diastolic : undefined
      }))
      .reverse()
  }

  // AI Insights
  const aiInsights = [
    { type: 'warning', message: 'Blood pressure trending higher over last 6 hours. Consider medication adjustment.' },
    { type: 'info', message: 'SpO2 stable on current oxygen therapy. May attempt wean if clinically appropriate.' },
    { type: 'success', message: 'Heart rate well controlled with current beta-blocker regimen.' }
  ]

  const TrendIcon = ({ type }: { type: string }) => {
    const trend = getTrend(type)
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-red-500" />
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-blue-500" />
    return <Minus className="h-4 w-4 text-slate-400" />
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Vital Signs Charting
        </h3>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          )}
          {onAddVitals && (
            <Button size="sm" onClick={onAddVitals}>
              <Plus className="h-4 w-4 mr-1" />
              Add Vitals
            </Button>
          )}
        </div>
      </div>

      {/* Vital Cards */}
      <div className="grid grid-cols-5 gap-3">
        {(Object.entries(vitalConfig) as [keyof typeof vitalConfig, typeof vitalConfig[keyof typeof vitalConfig]][]).map(([type, config]) => {
          const latest = getLatestVital(type)
          const Icon = config.icon
          const isSelected = selectedVital === type
          
          return (
            <Card 
              key={type}
              className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500' : 'hover:bg-slate-50'}`}
              onClick={() => setSelectedVital(type)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <Icon className="h-4 w-4" style={{ color: config.color }} />
                  {latest && <TrendIcon type={type} />}
                </div>
                <div className="text-2xl font-bold" style={{ color: latest?.isAbnormal ? '#ef4444' : undefined }}>
                  {latest ? formatValue(latest) : '—'}
                </div>
                <div className="text-xs text-muted-foreground">{config.label}</div>
                {latest?.isAbnormal && (
                  <Badge variant="destructive" className="mt-1 text-[10px]">Abnormal</Badge>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Trend Chart */}
      {showTrends && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {vitalConfig[selectedVital].label} Trend
              </CardTitle>
              <div className="flex gap-1">
                {(['6h', '12h', '24h', '48h'] as const).map(range => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={vitalConfig[selectedVital].color} 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  {selectedVital === 'bp' && (
                    <Line 
                      type="monotone" 
                      dataKey="diastolic" 
                      stroke={vitalConfig[selectedVital].color} 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3 }}
                    />
                  )}
                  {/* Reference lines for normal range */}
                  {typeof vitalConfig[selectedVital].normalRange.high === 'number' && (
                    <>
                      <ReferenceLine 
                        y={vitalConfig[selectedVital].normalRange.high as number} 
                        stroke="#ef4444" 
                        strokeDasharray="3 3"
                        label={{ value: 'High', fontSize: 10, fill: '#ef4444' }}
                      />
                      <ReferenceLine 
                        y={vitalConfig[selectedVital].normalRange.low as number} 
                        stroke="#3b82f6" 
                        strokeDasharray="3 3"
                        label={{ value: 'Low', fontSize: 10, fill: '#3b82f6' }}
                      />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {showAIInsights && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI Clinical Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {aiInsights.map((insight, i) => (
              <div 
                key={i}
                className={`flex items-start gap-2 p-2 rounded ${
                  insight.type === 'warning' ? 'bg-amber-50' :
                  insight.type === 'success' ? 'bg-green-50' :
                  'bg-blue-50'
                }`}
              >
                {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />}
                {insight.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />}
                {insight.type === 'info' && <Activity className="h-4 w-4 text-blue-600 mt-0.5" />}
                <span className="text-sm">{insight.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
