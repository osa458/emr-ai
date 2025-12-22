'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Users,
    ChevronRight,
    AlertCircle,
    Shield,
    Heart,
    Activity,
} from 'lucide-react'
import type { RiskCohort } from '@/lib/population-health'
import { cn } from '@/lib/utils'

interface RiskCohortsProps {
    cohorts: RiskCohort[]
    onCohortClick?: (cohort: RiskCohort) => void
    className?: string
}

export function RiskCohorts({
    cohorts,
    onCohortClick,
    className = '',
}: RiskCohortsProps) {
    const getRiskIcon = (level: RiskCohort['riskLevel']) => {
        switch (level) {
            case 'critical':
                return <AlertCircle className="h-5 w-5" />
            case 'high':
                return <Heart className="h-5 w-5" />
            case 'moderate':
                return <Activity className="h-5 w-5" />
            default:
                return <Shield className="h-5 w-5" />
        }
    }

    const getRiskStyles = (level: RiskCohort['riskLevel']) => {
        switch (level) {
            case 'critical':
                return { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', badge: 'bg-red-100 text-red-700' }
            case 'high':
                return { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' }
            case 'moderate':
                return { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' }
            case 'rising':
                return { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', badge: 'bg-green-100 text-green-700' }
            default:
                return { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' }
        }
    }

    const totalPatients = cohorts.reduce((sum, c) => sum + c.patientCount, 0)

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Risk Stratification
                    </CardTitle>
                    <Badge variant="outline">{totalPatients} patients</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {cohorts.map((cohort) => {
                        const styles = getRiskStyles(cohort.riskLevel)
                        const percentage = totalPatients > 0
                            ? Math.round((cohort.patientCount / totalPatients) * 100)
                            : 0

                        return (
                            <div
                                key={cohort.id}
                                className={cn(
                                    'rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md',
                                    styles.bg,
                                    styles.border
                                )}
                                onClick={() => onCohortClick?.(cohort)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn('p-2 rounded-full', styles.bg)}>
                                            <span className={styles.icon}>{getRiskIcon(cohort.riskLevel)}</span>
                                        </div>
                                        <div>
                                            <div className="font-medium">{cohort.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {cohort.description}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="font-bold text-lg">{cohort.patientCount}</div>
                                            <div className="text-xs text-muted-foreground">{percentage}%</div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                </div>

                                {/* Interventions */}
                                <div className="mt-3 flex flex-wrap gap-1">
                                    {cohort.interventions.slice(0, 3).map((intervention, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">
                                            {intervention}
                                        </Badge>
                                    ))}
                                    {cohort.interventions.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{cohort.interventions.length - 3} more
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Risk Distribution Bar */}
                <div className="mt-6">
                    <div className="text-sm font-medium mb-2">Risk Distribution</div>
                    <div className="h-3 rounded-full bg-gray-100 overflow-hidden flex">
                        {cohorts.map((cohort) => {
                            const percentage = totalPatients > 0
                                ? (cohort.patientCount / totalPatients) * 100
                                : 0

                            return (
                                <div
                                    key={cohort.id}
                                    className="h-full"
                                    style={{
                                        width: `${percentage}%`,
                                        backgroundColor: cohort.color,
                                    }}
                                    title={`${cohort.name}: ${cohort.patientCount} patients`}
                                />
                            )
                        })}
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>Critical → High → Moderate → Rising → Low</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
