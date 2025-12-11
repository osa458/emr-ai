'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity } from 'lucide-react'

interface VitalsTrendProps {
  patientId: string
}

// Reference ranges
const vitalDefs = [
  { key: 'hr', name: 'HR', unit: 'bpm', low: 60, high: 100 },
  { key: 'sbp', name: 'SBP', unit: 'mmHg', low: 90, high: 140 },
  { key: 'dbp', name: 'DBP', unit: 'mmHg', low: 60, high: 90 },
  { key: 'temp', name: 'Temp', unit: '°F', low: 97.8, high: 99.5 },
  { key: 'rr', name: 'RR', unit: '/min', low: 12, high: 20 },
  { key: 'spo2', name: 'SpO2', unit: '%', low: 95, high: 100 },
]

// Time columns
const timePoints = [0, 1, 2, 4, 8, 12, 24, 48]

function formatTimeAgo(hours: number): string {
  if (hours === 0) return 'Now'
  if (hours < 24) return `${hours}h`
  return `${hours / 24}d`
}

function getValueClass(value: number, low: number, high: number): string {
  if (value < low) return 'text-blue-600 font-semibold'
  if (value > high) return 'text-red-600 font-semibold'
  return ''
}

// Generate values for a vital sign across all time points
function generateVitalValues(key: string): number[] {
  return timePoints.map(hours => {
    const worseFactor = hours / 48
    switch (key) {
      case 'hr': return Math.round(78 + worseFactor * 18 + (Math.random() - 0.5) * 8)
      case 'sbp': return Math.round(125 + worseFactor * 20 + (Math.random() - 0.5) * 10)
      case 'dbp': return Math.round(78 + worseFactor * 10 + (Math.random() - 0.5) * 6)
      case 'temp': return Math.round((98.6 + worseFactor * 2.5 + (Math.random() - 0.5) * 0.5) * 10) / 10
      case 'rr': return Math.round(16 + worseFactor * 6 + (Math.random() - 0.5) * 3)
      case 'spo2': return Math.round(97 - worseFactor * 5 + (Math.random() - 0.5) * 2)
      default: return 0
    }
  })
}

export function VitalsTrend({ patientId }: VitalsTrendProps) {
  // Generate all vital values
  const vitalData = useMemo(() => {
    return vitalDefs.map(vital => ({
      ...vital,
      values: generateVitalValues(vital.key)
    }))
  }, [])

  const hrNow = vitalData.find(v => v.key === 'hr')?.values[0] || 0
  const tempNow = vitalData.find(v => v.key === 'temp')?.values[0] || 0
  const spo2Now = vitalData.find(v => v.key === 'spo2')?.values[0] || 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Vital Signs Trend
          </CardTitle>
          <div className="flex gap-2">
            {hrNow < 100 && <Badge variant="outline" className="bg-green-50 text-green-700">HR Stable</Badge>}
            {tempNow < 99.5 && <Badge variant="outline" className="bg-green-50 text-green-700">Afebrile</Badge>}
            {spo2Now >= 95 && <Badge variant="outline" className="bg-blue-50 text-blue-700">SpO2 OK</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="sticky left-0 bg-muted/50 px-3 py-2 text-left font-medium w-20">Vital</th>
                <th className="sticky left-20 bg-muted/50 px-2 py-2 text-left font-medium w-16 border-r">Unit</th>
                {timePoints.map(t => (
                  <th key={t} className={`px-3 py-2 text-center font-medium min-w-[50px] ${t === 0 ? 'bg-blue-50' : ''}`}>
                    {formatTimeAgo(t)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vitalData.map((vital, idx) => (
                <tr key={vital.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="sticky left-0 bg-inherit px-3 py-2 font-medium">{vital.name}</td>
                  <td className="sticky left-20 bg-inherit px-2 py-2 text-muted-foreground text-xs border-r">{vital.unit}</td>
                  {vital.values.map((val, i) => (
                    <td 
                      key={i} 
                      className={`px-3 py-2 text-center ${getValueClass(val, vital.low, vital.high)} ${i === 0 ? 'bg-blue-50 font-semibold' : ''}`}
                    >
                      {vital.key === 'temp' ? val.toFixed(1) : val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-4 py-2 text-xs text-muted-foreground border-t">
          <span className="text-red-600">■</span> High | <span className="text-blue-600">■</span> Low | Normal values in black
        </div>
      </CardContent>
    </Card>
  )
}
