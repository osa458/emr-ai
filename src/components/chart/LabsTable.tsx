'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FlaskConical, TrendingUp, TrendingDown, Minus, AlertTriangle, Calendar } from 'lucide-react'
import type { Observation } from '@medplum/fhirtypes'

interface LabsTableProps {
  labs: Observation[]
  isLoading?: boolean
}

interface LabGroup {
  name: string
  code: string
  results: Array<{
    value: number | string
    unit: string
    date: Date
    flag?: 'H' | 'L' | 'C'
    referenceRange?: string
  }>
}

// Reference ranges for common labs
const referenceRanges: Record<string, { low: number; high: number; unit: string }> = {
  'Creatinine': { low: 0.7, high: 1.3, unit: 'mg/dL' },
  'BUN': { low: 7, high: 20, unit: 'mg/dL' },
  'Sodium': { low: 136, high: 145, unit: 'mmol/L' },
  'Potassium': { low: 3.5, high: 5.0, unit: 'mmol/L' },
  'WBC': { low: 4.5, high: 11.0, unit: '10*3/uL' },
  'Hemoglobin': { low: 12.0, high: 17.5, unit: 'g/dL' },
  'BNP': { low: 0, high: 100, unit: 'pg/mL' },
  'Heart Rate': { low: 60, high: 100, unit: '/min' },
  'Oxygen Saturation': { low: 95, high: 100, unit: '%' },
}

function getLabFlag(name: string, value: number): 'H' | 'L' | undefined {
  const range = referenceRanges[name]
  if (!range) return undefined
  if (value > range.high) return 'H'
  if (value < range.low) return 'L'
  return undefined
}

function getTrend(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable'
  const recent = values[0]
  const previous = values[1]
  const diff = recent - previous
  const percentChange = Math.abs(diff / previous) * 100
  
  if (percentChange < 5) return 'stable'
  return diff > 0 ? 'up' : 'down'
}

export function LabsTable({ labs, isLoading }: LabsTableProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d')

  // Group labs by test name and sort by date
  const groupedLabs = useMemo(() => {
    const groups: Record<string, LabGroup> = {}
    
    const filteredLabs = labs.filter(lab => {
      const date = new Date(lab.effectiveDateTime || '')
      const now = new Date()
      const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      
      switch (timeRange) {
        case '24h': return hoursDiff <= 24
        case '7d': return hoursDiff <= 168
        case '30d': return hoursDiff <= 720
        default: return true
      }
    })

    filteredLabs.forEach(lab => {
      const name = lab.code?.text || lab.code?.coding?.[0]?.display || 'Unknown'
      const code = lab.code?.coding?.[0]?.code || ''
      
      if (!groups[name]) {
        groups[name] = { name, code, results: [] }
      }
      
      const numericValue = lab.valueQuantity?.value
      const stringValue = lab.valueString
      const unit = lab.valueQuantity?.unit || ''
      const date = new Date(lab.effectiveDateTime || '')
      
      // Handle numeric values
      if (numericValue !== undefined) {
        const flag = getLabFlag(name, numericValue)
        const range = referenceRanges[name]
        
        groups[name].results.push({
          value: numericValue,
          unit,
          date,
          flag,
          referenceRange: range ? `${range.low}-${range.high}` : undefined,
        })
      } 
      // Handle string values (cultures, etc.)
      else if (stringValue) {
        const interpretationCode = lab.interpretation?.[0]?.coding?.[0]?.code
        const flag = interpretationCode === 'H' || interpretationCode === 'POS' ? 'H' 
                   : interpretationCode === 'L' ? 'L' 
                   : undefined
        
        groups[name].results.push({
          value: stringValue,
          unit: '',
          date,
          flag,
          referenceRange: undefined,
        })
      }
    })

    // Sort results by date (most recent first)
    Object.values(groups).forEach(group => {
      group.results.sort((a, b) => b.date.getTime() - a.date.getTime())
    })

    // Filter out groups with no results and sort
    return Object.values(groups)
      .filter(group => group.results.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [labs, timeRange])

  // Separate into categories
  const categories = useMemo(() => {
    const metabolic = ['Sodium', 'Potassium', 'Creatinine', 'BUN', 'Glucose', 'CO2']
    const hematology = ['WBC', 'Hemoglobin', 'Hematocrit', 'Platelets']
    const cardiac = ['BNP', 'Troponin', 'CK-MB']
    
    return {
      all: groupedLabs,
      metabolic: groupedLabs.filter(g => metabolic.some(m => g.name.includes(m))),
      hematology: groupedLabs.filter(g => hematology.some(h => g.name.includes(h))),
      cardiac: groupedLabs.filter(g => cardiac.some(c => g.name.includes(c))),
      other: groupedLabs.filter(g => 
        !metabolic.some(m => g.name.includes(m)) &&
        !hematology.some(h => g.name.includes(h)) &&
        !cardiac.some(c => g.name.includes(c))
      ),
    }
  }, [groupedLabs])

  const displayedLabs = categories[selectedCategory as keyof typeof categories] || categories.all

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Laboratory Results
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(['24h', '7d', '30d', 'all'] as const).map(range => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range === 'all' ? 'All' : range}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList>
            <TabsTrigger value="all">All ({categories.all.length})</TabsTrigger>
            <TabsTrigger value="metabolic">Metabolic ({categories.metabolic.length})</TabsTrigger>
            <TabsTrigger value="hematology">Hematology ({categories.hematology.length})</TabsTrigger>
            <TabsTrigger value="cardiac">Cardiac ({categories.cardiac.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-4">
            {displayedLabs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No lab results in selected time range
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Latest Value</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Date/Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedLabs.map((group) => {
                    const latest = group.results[0]
                    if (!latest) return null
                    
                    const values = group.results.map(r => typeof r.value === 'number' ? r.value : 0)
                    const trend = getTrend(values)
                    
                    return (
                      <TableRow key={group.name}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={latest.flag ? 'font-bold' : ''}>
                              {typeof latest.value === 'string' && latest.value.length > 50 
                                ? latest.value.substring(0, 50) + '...' 
                                : latest.value} {latest.unit}
                            </span>
                            {latest.flag && (
                              <Badge 
                                variant={latest.flag === 'H' ? 'destructive' : 'secondary'}
                                className={latest.flag === 'L' ? 'bg-blue-100 text-blue-800' : ''}
                              >
                                {latest.flag === 'H' ? 'High' : 'Low'}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {latest.referenceRange || '—'}
                        </TableCell>
                        <TableCell>
                          {trend === 'up' && (
                            <TrendingUp className="h-4 w-4 text-red-500" />
                          )}
                          {trend === 'down' && (
                            <TrendingDown className="h-4 w-4 text-green-500" />
                          )}
                          {trend === 'stable' && (
                            <Minus className="h-4 w-4 text-gray-400" />
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {latest.date.toLocaleDateString()}{' '}
                            {latest.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>

        {/* Critical Values Alert */}
        {displayedLabs.some(g => g.results[0]?.flag) && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Abnormal values detected</span>
            </div>
            <div className="mt-1 text-sm text-amber-700">
              {displayedLabs
                .filter(g => g.results[0]?.flag)
                .map(g => g.name)
                .join(', ')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
