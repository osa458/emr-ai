'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Target,
  Users,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react'

export interface QualityMeasure {
  id: string
  cmsId: string
  name: string
  description: string
  category: 'preventive' | 'chronic' | 'outcome' | 'safety'
  numerator: number
  denominator: number
  performance: number
  benchmark: number
  trend: 'improving' | 'stable' | 'declining'
  lastUpdated: string
}

export interface PatientGap {
  patientId: string
  patientName: string
  measureId: string
  measureName: string
  dueDate?: string
  priority: 'high' | 'medium' | 'low'
  action: string
}

interface ClinicalQualityMeasuresProps {
  measures: QualityMeasure[]
  patientGaps: PatientGap[]
  onRefresh?: () => void
  onExport?: () => void
  onCloseGap?: (patientId: string, measureId: string) => void
}

const categoryConfig = {
  preventive: { label: 'Preventive Care', color: 'bg-blue-100 text-blue-800' },
  chronic: { label: 'Chronic Disease', color: 'bg-purple-100 text-purple-800' },
  outcome: { label: 'Outcome', color: 'bg-green-100 text-green-800' },
  safety: { label: 'Patient Safety', color: 'bg-red-100 text-red-800' },
}

const trendIcons = {
  improving: { icon: TrendingUp, color: 'text-green-500' },
  stable: { icon: Target, color: 'text-yellow-500' },
  declining: { icon: TrendingDown, color: 'text-red-500' },
}

function getPerformanceColor(performance: number, benchmark: number): string {
  if (performance >= benchmark) return 'text-green-600'
  if (performance >= benchmark * 0.9) return 'text-yellow-600'
  return 'text-red-600'
}

function getPerformanceIcon(performance: number, benchmark: number) {
  if (performance >= benchmark) return CheckCircle
  if (performance >= benchmark * 0.9) return AlertTriangle
  return XCircle
}

// Sample CMS quality measures
const sampleMeasures: QualityMeasure[] = [
  {
    id: '1',
    cmsId: 'CMS122',
    name: 'Diabetes: Hemoglobin A1c Poor Control',
    description: 'Percentage of patients 18-75 with diabetes who had hemoglobin A1c > 9.0%',
    category: 'chronic',
    numerator: 15,
    denominator: 120,
    performance: 87.5,
    benchmark: 85,
    trend: 'improving',
    lastUpdated: '2024-12-01',
  },
  {
    id: '2',
    cmsId: 'CMS165',
    name: 'Controlling High Blood Pressure',
    description: 'Percentage of patients 18-85 with hypertension with BP < 140/90',
    category: 'chronic',
    numerator: 180,
    denominator: 230,
    performance: 78.3,
    benchmark: 80,
    trend: 'stable',
    lastUpdated: '2024-12-01',
  },
  {
    id: '3',
    cmsId: 'CMS125',
    name: 'Breast Cancer Screening',
    description: 'Percentage of women 50-74 who had a mammogram in past 2 years',
    category: 'preventive',
    numerator: 145,
    denominator: 180,
    performance: 80.6,
    benchmark: 75,
    trend: 'improving',
    lastUpdated: '2024-12-01',
  },
  {
    id: '4',
    cmsId: 'CMS130',
    name: 'Colorectal Cancer Screening',
    description: 'Percentage of patients 50-75 with appropriate colorectal cancer screening',
    category: 'preventive',
    numerator: 200,
    denominator: 290,
    performance: 69.0,
    benchmark: 72,
    trend: 'declining',
    lastUpdated: '2024-12-01',
  },
  {
    id: '5',
    cmsId: 'CMS147',
    name: 'Preventive Care: Influenza Immunization',
    description: 'Percentage of patients 6 months+ who received influenza vaccine',
    category: 'preventive',
    numerator: 450,
    denominator: 580,
    performance: 77.6,
    benchmark: 70,
    trend: 'improving',
    lastUpdated: '2024-12-01',
  },
  {
    id: '6',
    cmsId: 'CMS138',
    name: 'Tobacco Use Screening and Cessation',
    description: 'Percentage of patients 18+ screened for tobacco use with cessation intervention',
    category: 'preventive',
    numerator: 520,
    denominator: 550,
    performance: 94.5,
    benchmark: 85,
    trend: 'stable',
    lastUpdated: '2024-12-01',
  },
]

const sampleGaps: PatientGap[] = [
  { patientId: 'p1', patientName: 'John Smith', measureId: '2', measureName: 'Blood Pressure Control', priority: 'high', action: 'Schedule follow-up for BP check' },
  { patientId: 'p2', patientName: 'Maria Garcia', measureId: '4', measureName: 'Colorectal Cancer Screening', dueDate: '2024-12-31', priority: 'medium', action: 'Order colonoscopy' },
  { patientId: 'p3', patientName: 'Robert Johnson', measureId: '1', measureName: 'Diabetes A1c Control', priority: 'high', action: 'Lab order for HbA1c' },
  { patientId: 'p4', patientName: 'Sarah Williams', measureId: '3', measureName: 'Breast Cancer Screening', dueDate: '2024-12-15', priority: 'medium', action: 'Schedule mammogram' },
  { patientId: 'p5', patientName: 'Michael Brown', measureId: '5', measureName: 'Flu Vaccination', priority: 'low', action: 'Administer flu vaccine' },
]

export function ClinicalQualityMeasures({
  measures = sampleMeasures,
  patientGaps = sampleGaps,
  onRefresh,
  onExport,
  onCloseGap,
}: ClinicalQualityMeasuresProps) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredMeasures = selectedCategory === 'all'
    ? measures
    : measures.filter(m => m.category === selectedCategory)

  const overallPerformance = measures.reduce((sum, m) => sum + m.performance, 0) / measures.length
  const meetingBenchmark = measures.filter(m => m.performance >= m.benchmark).length
  const highPriorityGaps = patientGaps.filter(g => g.priority === 'high').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-500" />
            Clinical Quality Measures
          </h1>
          <p className="text-muted-foreground">
            Performance metrics and care gap management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Performance</p>
                <p className="text-2xl font-bold">{overallPerformance.toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meeting Benchmark</p>
                <p className="text-2xl font-bold">{meetingBenchmark}/{measures.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Care Gaps</p>
                <p className="text-2xl font-bold">{patientGaps.length}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-red-600">{highPriorityGaps}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="measures">All Measures</TabsTrigger>
          <TabsTrigger value="gaps">Care Gaps</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {measures.slice(0, 6).map(measure => {
              const TrendIcon = trendIcons[measure.trend].icon
              const PerformanceIcon = getPerformanceIcon(measure.performance, measure.benchmark)
              return (
                <Card key={measure.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Badge className={categoryConfig[measure.category].color}>
                          {measure.cmsId}
                        </Badge>
                        <h3 className="font-medium mt-1">{measure.name}</h3>
                      </div>
                      <TrendIcon className={`h-5 w-5 ${trendIcons[measure.trend].color}`} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Performance</span>
                        <span className={`font-bold ${getPerformanceColor(measure.performance, measure.benchmark)}`}>
                          {measure.performance.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={measure.performance} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Benchmark: {measure.benchmark}%</span>
                        <span>{measure.numerator}/{measure.denominator} patients</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* All Measures Tab */}
        <TabsContent value="measures">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Quality Measures</CardTitle>
                <div className="flex gap-2">
                  {['all', 'preventive', 'chronic', 'outcome', 'safety'].map(cat => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat === 'all' ? 'All' : categoryConfig[cat as keyof typeof categoryConfig]?.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Measure</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Benchmark</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMeasures.map(measure => {
                    const TrendIcon = trendIcons[measure.trend].icon
                    const PerformanceIcon = getPerformanceIcon(measure.performance, measure.benchmark)
                    return (
                      <TableRow key={measure.id}>
                        <TableCell>
                          <div>
                            <span className="font-mono text-xs text-muted-foreground">{measure.cmsId}</span>
                            <div className="font-medium">{measure.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={categoryConfig[measure.category].color}>
                            {categoryConfig[measure.category].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${getPerformanceColor(measure.performance, measure.benchmark)}`}>
                            {measure.performance.toFixed(1)}%
                          </span>
                          <div className="text-xs text-muted-foreground">
                            {measure.numerator}/{measure.denominator}
                          </div>
                        </TableCell>
                        <TableCell>{measure.benchmark}%</TableCell>
                        <TableCell>
                          <TrendIcon className={`h-4 w-4 ${trendIcons[measure.trend].color}`} />
                        </TableCell>
                        <TableCell>
                          <PerformanceIcon className={`h-5 w-5 ${getPerformanceColor(measure.performance, measure.benchmark)}`} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Care Gaps Tab */}
        <TabsContent value="gaps">
          <Card>
            <CardHeader>
              <CardTitle>Patient Care Gaps</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Measure</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Action Needed</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patientGaps.map((gap, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{gap.patientName}</TableCell>
                      <TableCell>{gap.measureName}</TableCell>
                      <TableCell>
                        <Badge className={
                          gap.priority === 'high' ? 'bg-red-100 text-red-800' :
                          gap.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {gap.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {gap.dueDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {gap.dueDate}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-sm">{gap.action}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => onCloseGap?.(gap.patientId, gap.measureId)}
                        >
                          Close Gap
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ClinicalQualityMeasures
