'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertTriangle,
  Activity,
  RefreshCw,
  ChevronRight,
  Zap,
} from 'lucide-react'
import type { MorningTriageOutput } from '@/lib/llm/schemas'

const riskColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
}

export default function MorningTriagePage() {
  const [triage, setTriage] = useState<MorningTriageOutput | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTriage = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/ai/morning-triage')
      const result = await response.json()
      if (result.success) {
        setTriage(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to fetch triage data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTriage()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Morning Triage</h1>
          <p className="text-muted-foreground">
            {triage?.generatedAt
              ? `Generated at ${new Date(triage.generatedAt).toLocaleTimeString()}`
              : 'Patient prioritization and quick wins'}
          </p>
        </div>
        <Button variant="outline" onClick={fetchTriage} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {triage && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Patients"
            value={triage.totalPatients}
            icon={Activity}
          />
          <SummaryCard
            title="Critical"
            value={triage.criticalCount}
            icon={AlertTriangle}
            className="text-red-600"
          />
          <SummaryCard
            title="High Risk"
            value={triage.highRiskCount}
            icon={AlertTriangle}
            className="text-orange-600"
          />
          <SummaryCard
            title="System Alerts"
            value={triage.systemAlerts.length}
            icon={Zap}
            className="text-yellow-600"
          />
        </div>
      )}

      {/* System Alerts */}
      {triage && triage.systemAlerts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Zap className="h-5 w-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {triage.systemAlerts.map((alert, i) => (
                <div key={i} className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{alert.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      ) : triage?.patients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No patients to display
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {triage?.patients.map((patient) => (
            <Card key={patient.patientId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Badge className={riskColors[patient.riskLevel]}>
                        {patient.riskLevel.toUpperCase()}
                      </Badge>
                      <h3 className="font-semibold">{patient.patientName}</h3>
                      <span className="text-sm text-muted-foreground">
                        {patient.location}
                      </span>
                    </div>

                    {/* Risk Factors */}
                    <div className="mt-3 space-y-1">
                      {patient.riskFactors.slice(0, 3).map((factor, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <AlertTriangle
                            className={`h-3 w-3 ${
                              factor.severity === 'critical'
                                ? 'text-red-500'
                                : factor.severity === 'high'
                                ? 'text-orange-500'
                                : 'text-yellow-500'
                            }`}
                          />
                          <span>
                            <strong>{factor.factor}:</strong> {factor.details}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Quick Wins */}
                    {patient.quickWins.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {patient.quickWins.slice(0, 2).map((win, i) => (
                          <Badge key={i} variant="outline" className="bg-blue-50">
                            <Zap className="mr-1 h-3 w-3" />
                            {win.action}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link href={`/patients/${patient.patientId}`}>
                    <Button variant="ghost" size="sm">
                      View Chart
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      {triage?.disclaimer && (
        <p className="text-xs text-muted-foreground text-center">
          {triage.disclaimer}
        </p>
      )}
    </div>
  )
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  className,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  className?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 md:gap-4 p-3 md:p-4">
        <div className={`rounded-full bg-gray-100 p-2 md:p-3 ${className}`} aria-hidden="true">
          <Icon className="h-5 w-5 md:h-6 md:w-6" />
        </div>
        <div>
          <div className="text-xl md:text-2xl font-bold" aria-label={`${value} ${title}`}>{value}</div>
          <div className="text-xs md:text-sm text-muted-foreground">{title}</div>
        </div>
      </CardContent>
    </Card>
  )
}
