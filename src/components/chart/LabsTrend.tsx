'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FlaskConical } from 'lucide-react'

interface LabsTrendProps {
  patientId?: string
}

// Lab definitions with reference ranges and panel grouping
const bmpLabs = [
  { key: 'na', name: 'Na', unit: 'mmol/L', low: 136, high: 145, baseline: 140, panel: 'BMP' },
  { key: 'k', name: 'K', unit: 'mmol/L', low: 3.5, high: 5.0, baseline: 4.2, panel: 'BMP' },
  { key: 'cl', name: 'Cl', unit: 'mmol/L', low: 98, high: 106, baseline: 102, panel: 'BMP' },
  { key: 'co2', name: 'CO2', unit: 'mmol/L', low: 22, high: 29, baseline: 25, panel: 'BMP' },
  { key: 'bun', name: 'BUN', unit: 'mg/dL', low: 7, high: 20, baseline: 15, panel: 'BMP' },
  { key: 'cr', name: 'Cr', unit: 'mg/dL', low: 0.7, high: 1.3, baseline: 1.0, panel: 'BMP' },
  { key: 'glu', name: 'Glucose', unit: 'mg/dL', low: 70, high: 100, baseline: 95, panel: 'BMP' },
  { key: 'ca', name: 'Ca', unit: 'mg/dL', low: 8.5, high: 10.5, baseline: 9.5, panel: 'BMP' },
]

const cbcLabs = [
  { key: 'wbc', name: 'WBC', unit: 'K/uL', low: 4.5, high: 11.0, baseline: 7.5, panel: 'CBC' },
  { key: 'hgb', name: 'Hgb', unit: 'g/dL', low: 12.0, high: 17.5, baseline: 14.0, panel: 'CBC' },
  { key: 'hct', name: 'Hct', unit: '%', low: 36, high: 50, baseline: 42, panel: 'CBC' },
  { key: 'plt', name: 'Plt', unit: 'K/uL', low: 150, high: 400, baseline: 250, panel: 'CBC' },
]

const lftLabs = [
  { key: 'alt', name: 'ALT', unit: 'U/L', low: 7, high: 56, baseline: 25, panel: 'LFT' },
  { key: 'ast', name: 'AST', unit: 'U/L', low: 10, high: 40, baseline: 22, panel: 'LFT' },
  { key: 'alp', name: 'Alk Phos', unit: 'U/L', low: 44, high: 147, baseline: 70, panel: 'LFT' },
  { key: 'tbili', name: 'T. Bili', unit: 'mg/dL', low: 0.1, high: 1.2, baseline: 0.6, panel: 'LFT' },
  { key: 'alb', name: 'Albumin', unit: 'g/dL', low: 3.5, high: 5.0, baseline: 4.0, panel: 'LFT' },
]

const cardiacLabs = [
  { key: 'bnp', name: 'BNP', unit: 'pg/mL', low: 0, high: 100, baseline: 50, panel: 'Cardiac' },
  { key: 'trop', name: 'Troponin', unit: 'ng/mL', low: 0, high: 0.04, baseline: 0.01, panel: 'Cardiac' },
]

// All labs combined
const allLabs = [...bmpLabs, ...cbcLabs, ...lftLabs, ...cardiacLabs]

const labPanels = {
  all: allLabs,
  bmp: bmpLabs,
  cbc: cbcLabs,
  lft: lftLabs,
  cardiac: cardiacLabs,
}

// Generate 30 time points (days 0-7 inpatient, then outpatient at 14, 21, 30, 45, 60 days ago)
function generateTimePoints(): { daysAgo: number; label: string; isInpatient: boolean }[] {
  const points: { daysAgo: number; label: string; isInpatient: boolean }[] = []
  
  // Inpatient: every day for 7 days
  for (let i = 0; i <= 7; i++) {
    points.push({
      daysAgo: i,
      label: i === 0 ? 'Today' : i === 1 ? '1d' : `${i}d`,
      isInpatient: true
    })
  }
  
  // Gap then outpatient
  const outpatientDays = [14, 21, 30, 45, 60]
  outpatientDays.forEach(d => {
    points.push({
      daysAgo: d,
      label: `${d}d`,
      isInpatient: false
    })
  })
  
  return points
}

function getValueClass(value: number | null, low: number, high: number): string {
  if (value === null) return 'text-gray-300'
  if (value < low) return 'text-blue-600 font-semibold'
  if (value > high) return 'text-red-600 font-semibold'
  return ''
}

// Generate lab value based on day and patient status
function generateLabValue(
  lab: { baseline: number; low: number; high: number },
  daysAgo: number,
  isInpatient: boolean
): number | null {
  // Outpatient: baseline values
  if (!isInpatient) {
    return Math.round((lab.baseline + (Math.random() - 0.5) * 0.1 * lab.baseline) * 100) / 100
  }
  
  // Day 7 (admission): worst values
  // Day 0 (today): improving toward normal
  const admissionWorsening = 0.4 // How much worse on admission (40% deviation)
  const progress = (7 - daysAgo) / 7 // 0 on day 7, 1 on day 0
  
  // Calculate value trending from admission (bad) to current (improving)
  const deviation = admissionWorsening * (1 - progress)
  const direction = lab.baseline < (lab.high + lab.low) / 2 ? -1 : 1 // Which way is "worse"
  const value = lab.baseline + direction * deviation * lab.baseline + (Math.random() - 0.5) * 0.05 * lab.baseline
  
  return Math.round(value * 100) / 100
}

export function LabsTrend({ patientId }: LabsTrendProps) {
  const [selectedPanel, setSelectedPanel] = useState<'all' | 'bmp' | 'cbc' | 'lft' | 'cardiac'>('all')
  const timePoints = useMemo(() => generateTimePoints(), [])
  
  const labs = labPanels[selectedPanel]
  
  // Generate all lab data
  const labData = useMemo(() => {
    return labs.map(lab => ({
      ...lab,
      values: timePoints.map(tp => generateLabValue(lab, tp.daysAgo, tp.isInpatient))
    }))
  }, [labs, timePoints])

  // Count abnormals in latest values
  const abnormalCount = labData.filter(lab => {
    const latest = lab.values[0]
    return latest !== null && (latest < lab.low || latest > lab.high)
  }).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Lab Trends
          </CardTitle>
          <div className="flex items-center gap-3">
            {abnormalCount > 0 && (
              <Badge variant="destructive">{abnormalCount} Abnormal</Badge>
            )}
            <Tabs value={selectedPanel} onValueChange={(v) => setSelectedPanel(v as typeof selectedPanel)}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-3 h-6 font-semibold">All</TabsTrigger>
                <TabsTrigger value="bmp" className="text-xs px-2 h-6">BMP</TabsTrigger>
                <TabsTrigger value="cbc" className="text-xs px-2 h-6">CBC</TabsTrigger>
                <TabsTrigger value="lft" className="text-xs px-2 h-6">LFT</TabsTrigger>
                <TabsTrigger value="cardiac" className="text-xs px-2 h-6">Cardiac</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left font-medium min-w-[80px]">Lab</th>
                <th className="sticky left-[80px] z-10 bg-muted/50 px-2 py-2 text-left font-medium min-w-[60px] border-r text-xs">Range</th>
                {timePoints.map((tp, i) => (
                  <th 
                    key={i} 
                    className={`px-2 py-2 text-center font-medium min-w-[45px] text-xs ${
                      tp.daysAgo === 0 ? 'bg-blue-100' : 
                      tp.isInpatient ? 'bg-green-50' : 'bg-orange-50'
                    }`}
                  >
                    {tp.label}
                  </th>
                ))}
              </tr>
              <tr className="border-b text-[10px] text-muted-foreground">
                <th className="sticky left-0 z-10 bg-white"></th>
                <th className="sticky left-[80px] z-10 bg-white border-r"></th>
                {timePoints.map((tp, i) => (
                  <th 
                    key={i} 
                    className={`px-1 py-0.5 text-center ${
                      tp.daysAgo === 0 ? 'bg-blue-50' : 
                      tp.isInpatient ? 'bg-green-50/50' : 'bg-orange-50/50'
                    }`}
                  >
                    {tp.isInpatient ? 'IP' : 'OP'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labData.map((lab, idx) => {
                // Show panel header row when viewing "all" and panel changes
                const showPanelHeader = selectedPanel === 'all' && 
                  (idx === 0 || lab.panel !== labData[idx - 1].panel)
                
                return (
                  <React.Fragment key={lab.key}>
                    {showPanelHeader && (
                      <tr className="bg-slate-100">
                        <td 
                          colSpan={2 + timePoints.length} 
                          className="sticky left-0 px-3 py-1 text-xs font-bold text-slate-600 uppercase tracking-wide"
                        >
                          {lab.panel}
                        </td>
                      </tr>
                    )}
                    <tr className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 font-medium">{lab.name}</td>
                      <td className="sticky left-[80px] z-10 bg-inherit px-2 py-1.5 text-xs text-muted-foreground border-r whitespace-nowrap">
                        {lab.low}-{lab.high}
                      </td>
                      {lab.values.map((val, i) => (
                        <td 
                          key={i} 
                          className={`px-2 py-1.5 text-center text-xs ${getValueClass(val, lab.low, lab.high)} ${
                            i === 0 ? 'bg-blue-50 font-semibold' : ''
                          }`}
                        >
                          {val !== null ? (
                            lab.key === 'trop' || lab.key === 'cr' ? val.toFixed(2) : 
                            lab.key === 'tbili' ? val.toFixed(1) :
                            Math.round(val)
                          ) : '—'}
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        
        <div className="px-4 py-2 text-xs text-muted-foreground border-t flex gap-4">
          <span><span className="inline-block w-3 h-3 bg-blue-100 mr-1"></span>Today</span>
          <span><span className="inline-block w-3 h-3 bg-green-50 mr-1 border"></span>Inpatient</span>
          <span><span className="inline-block w-3 h-3 bg-orange-50 mr-1 border"></span>Outpatient</span>
          <span className="ml-auto"><span className="text-red-600">■</span> High | <span className="text-blue-600">■</span> Low</span>
        </div>
      </CardContent>
    </Card>
  )
}
