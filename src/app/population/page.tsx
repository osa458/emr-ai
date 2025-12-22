'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    BarChart3,
    Users,
    Target,
    AlertTriangle,
    RefreshCw,
    Loader2,
    ArrowLeft,
    TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { MetricsOverview, RiskCohorts } from '@/components/population'
import type { PopulationMetrics, RiskCohort } from '@/lib/population-health'

interface MetricsResponse extends PopulationMetrics {
    success: boolean
}

interface CohortsResponse {
    success: boolean
    cohorts: RiskCohort[]
    summary: {
        totalPatients: number
        highRiskCount: number
        highRiskPercentage: number
    }
}

export default function PopulationDashboardPage() {
    const [selectedCohort, setSelectedCohort] = useState<RiskCohort | null>(null)

    const { data: metricsData, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<MetricsResponse>({
        queryKey: ['population-metrics'],
        queryFn: async () => {
            const res = await fetch('/api/population/metrics')
            return res.json()
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    const { data: cohortsData, isLoading: cohortsLoading, refetch: refetchCohorts } = useQuery<CohortsResponse>({
        queryKey: ['population-cohorts'],
        queryFn: async () => {
            const res = await fetch('/api/population/risk-cohorts')
            return res.json()
        },
        staleTime: 5 * 60 * 1000,
    })

    const isLoading = metricsLoading || cohortsLoading

    const handleRefresh = () => {
        refetchMetrics()
        refetchCohorts()
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Dashboard
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    <BarChart3 className="h-6 w-6" />
                                    Population Health
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Quality measures and risk stratification
                                </p>
                            </div>
                        </div>
                        <Button onClick={handleRefresh} disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Refresh
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Tabs defaultValue="overview" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="overview" className="flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Quality Metrics
                            </TabsTrigger>
                            <TabsTrigger value="risk" className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Risk Stratification
                            </TabsTrigger>
                            <TabsTrigger value="gaps" className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Care Gaps
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview">
                            {metricsData?.success && (
                                <MetricsOverview
                                    results={metricsData.measureResults}
                                    overallPerformance={metricsData.overallPerformance}
                                    totalPatients={metricsData.totalPatients}
                                />
                            )}
                        </TabsContent>

                        <TabsContent value="risk">
                            {cohortsData?.success && (
                                <div className="grid gap-6 lg:grid-cols-3">
                                    <div className="lg:col-span-2">
                                        <RiskCohorts
                                            cohorts={cohortsData.cohorts}
                                            onCohortClick={setSelectedCohort}
                                        />
                                    </div>
                                    <div>
                                        {/* Summary Card */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Risk Summary</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">Total Patients</span>
                                                    <span className="font-bold">{cohortsData.summary.totalPatients}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">High/Critical Risk</span>
                                                    <Badge variant="destructive">
                                                        {cohortsData.summary.highRiskCount} ({cohortsData.summary.highRiskPercentage}%)
                                                    </Badge>
                                                </div>
                                                <div className="pt-4 border-t">
                                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                                        <TrendingUp className="h-4 w-4" />
                                                        <span>Risk scores trending down 3% this month</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Selected Cohort Details */}
                                        {selectedCohort && (
                                            <Card className="mt-4">
                                                <CardHeader>
                                                    <CardTitle className="text-base">{selectedCohort.name}</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm text-muted-foreground mb-4">
                                                        {selectedCohort.description}
                                                    </p>
                                                    <div className="space-y-2">
                                                        <div className="text-sm font-medium">Criteria:</div>
                                                        <ul className="text-sm space-y-1">
                                                            {selectedCohort.criteria.map((c, i) => (
                                                                <li key={i} className="text-muted-foreground">• {c}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className="mt-4">
                                                        <Link href={`/patients?cohort=${selectedCohort.id}`}>
                                                            <Button className="w-full">
                                                                View Patients ({selectedCohort.patientCount})
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="gaps">
                            {metricsData?.success && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Care Gap Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {metricsData.measureResults
                                                .filter(r => r.gap > 0)
                                                .sort((a, b) => b.gap - a.gap)
                                                .map(result => (
                                                    <div key={result.measureId} className="flex items-center justify-between border-b pb-3">
                                                        <div>
                                                            <div className="font-medium">{result.measureName}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {result.gap} patient{result.gap !== 1 ? 's' : ''} need attention
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Badge variant="outline" className="bg-orange-50 text-orange-700">
                                                                {result.gap} gaps
                                                            </Badge>
                                                            <Link href={`/patients?measure=${result.measureId}&status=gap`}>
                                                                <Button variant="outline" size="sm">
                                                                    View
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                ))}
                                            {metricsData.measureResults.every(r => r.gap === 0) && (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    No care gaps detected
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </main>
        </div>
    )
}
