'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Target,
    Users,
    AlertTriangle,
} from 'lucide-react'
import type { MeasureResult } from '@/lib/population-health'
import { cn } from '@/lib/utils'

interface MetricsOverviewProps {
    results: MeasureResult[]
    overallPerformance: number
    totalPatients: number
    className?: string
}

export function MetricsOverview({
    results,
    overallPerformance,
    totalPatients,
    className = '',
}: MetricsOverviewProps) {
    const getStatusColor = (rate: number, target: number) => {
        const ratio = rate / target
        if (ratio >= 1) return 'text-green-600 bg-green-50'
        if (ratio >= 0.8) return 'text-yellow-600 bg-yellow-50'
        return 'text-red-600 bg-red-50'
    }

    const getTrendIcon = (trend?: 'improving' | 'declining' | 'stable') => {
        switch (trend) {
            case 'improving':
                return <TrendingUp className="h-4 w-4 text-green-500" />
            case 'declining':
                return <TrendingDown className="h-4 w-4 text-red-500" />
            default:
                return <Minus className="h-4 w-4 text-gray-400" />
        }
    }

    const totalGaps = results.reduce((sum, r) => sum + r.gap, 0)

    return (
        <div className={cn('space-y-4', className)}>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Overall Performance</p>
                                <p className="text-3xl font-bold">{overallPerformance}%</p>
                            </div>
                            <div className={cn(
                                'h-12 w-12 rounded-full flex items-center justify-center',
                                overallPerformance >= 80 ? 'bg-green-100' : overallPerformance >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                            )}>
                                <Target className={cn(
                                    'h-6 w-6',
                                    overallPerformance >= 80 ? 'text-green-600' : overallPerformance >= 60 ? 'text-yellow-600' : 'text-red-600'
                                )} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Patients</p>
                                <p className="text-3xl font-bold">{totalPatients.toLocaleString()}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Measures Tracked</p>
                                <p className="text-3xl font-bold">{results.length}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <Target className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Care Gaps</p>
                                <p className="text-3xl font-bold">{totalGaps.toLocaleString()}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Measure Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Quality Measures Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {results.map((result) => (
                            <div key={result.measureId} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{result.measureName}</span>
                                        {getTrendIcon(result.trend)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={getStatusColor(result.rate, result.target)}>
                                            {result.rate}%
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            Target: {result.target}%
                                        </span>
                                    </div>
                                </div>
                                <Progress
                                    value={result.rate}
                                    className="h-2"
                                />
                                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                    <span>{result.numerator} / {result.denominator} patients</span>
                                    <span>{result.gap} gap{result.gap !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
