'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CheckCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react'

// Mock discharge planning data
const mockPatients = [
  {
    id: 'patient-5',
    name: 'Michael Brown',
    location: 'Room 108',
    diagnosis: 'Cellulitis',
    los: 2,
    readiness: 'READY_TODAY',
    blockingFactors: 0,
    pendingTests: 0,
    targetDate: 'Today',
  },
  {
    id: 'patient-4',
    name: 'Maria Garcia',
    location: 'Room 422',
    diagnosis: 'CAP',
    los: 3,
    readiness: 'READY_TODAY',
    blockingFactors: 0,
    pendingTests: 0,
    targetDate: 'Today',
  },
  {
    id: 'patient-3',
    name: 'John Smith',
    location: 'Room 218',
    diagnosis: 'CHF Exacerbation',
    los: 4,
    readiness: 'READY_SOON',
    blockingFactors: 2,
    pendingTests: 1,
    targetDate: 'Tomorrow',
  },
  {
    id: 'patient-2',
    name: 'Sarah Williams',
    location: 'Room 305',
    diagnosis: 'COPD Exacerbation',
    los: 5,
    readiness: 'READY_SOON',
    blockingFactors: 1,
    pendingTests: 0,
    targetDate: '2-3 days',
  },
  {
    id: 'patient-1',
    name: 'Robert Johnson',
    location: 'Room 412',
    diagnosis: 'AKI',
    los: 6,
    readiness: 'NOT_READY',
    blockingFactors: 3,
    pendingTests: 2,
    targetDate: 'TBD',
  },
]

const readinessConfig: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  READY_TODAY: {
    label: 'Ready Today',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  READY_SOON: {
    label: 'Ready Soon',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  NOT_READY: {
    label: 'Not Ready',
    color: 'bg-red-100 text-red-800',
    icon: AlertCircle,
  },
}

export default function DischargePlanningPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const readyToday = mockPatients.filter((p) => p.readiness === 'READY_TODAY').length
  const readySoon = mockPatients.filter((p) => p.readiness === 'READY_SOON').length
  const notReady = mockPatients.filter((p) => p.readiness === 'NOT_READY').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Discharge Planning</h1>
        <p className="text-muted-foreground">
          Track discharge readiness and coordinate discharges
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-700">
                  {readyToday}
                </div>
                <div className="text-sm text-green-600">Ready Today</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-yellow-700">
                  {readySoon}
                </div>
                <div className="text-sm text-yellow-600">Ready Soon</div>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-red-700">{notReady}</div>
                <div className="text-sm text-red-600">Not Ready</div>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discharge Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Discharge Queue</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Diagnosis</TableHead>
              <TableHead>LOS</TableHead>
              <TableHead>Readiness</TableHead>
              <TableHead>Blocking</TableHead>
              <TableHead>Pending Tests</TableHead>
              <TableHead>Target</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))
            ) : mockPatients.map((patient) => {
              const config = readinessConfig[patient.readiness]
              const Icon = config.icon

              return (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell>{patient.location}</TableCell>
                  <TableCell>{patient.diagnosis}</TableCell>
                  <TableCell>{patient.los} days</TableCell>
                  <TableCell>
                    <Badge className={config.color}>
                      <Icon className="mr-1 h-3 w-3" />
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {patient.blockingFactors > 0 ? (
                      <span className="text-red-600">
                        {patient.blockingFactors}
                      </span>
                    ) : (
                      <span className="text-green-600">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {patient.pendingTests > 0 ? (
                      <span className="text-yellow-600">
                        {patient.pendingTests}
                      </span>
                    ) : (
                      <span className="text-green-600">0</span>
                    )}
                  </TableCell>
                  <TableCell>{patient.targetDate}</TableCell>
                  <TableCell>
                    <Link href={`/patients/${patient.id}/discharge`}>
                      <Button variant="ghost" size="sm">
                        Details
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
