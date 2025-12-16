'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { usePatientCarePlans } from '@/hooks/useFHIRData'
import { ClipboardList, Calendar, Target, AlertCircle, CheckCircle } from 'lucide-react'
import type { CarePlan } from '@medplum/fhirtypes'

interface CarePlanPanelProps {
    patientId: string
}

export function CarePlanPanel({ patientId }: CarePlanPanelProps) {
    const { data: carePlans, isLoading, isError } = usePatientCarePlans(patientId)

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Ongoing'
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800'
            case 'completed': return 'bg-blue-100 text-blue-800'
            case 'draft': return 'bg-yellow-100 text-yellow-800'
            case 'revoked': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getPlanTitle = (plan: CarePlan) => {
        return plan.title || plan.category?.[0]?.text || plan.category?.[0]?.coding?.[0]?.display || 'Care Plan'
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5" />
                        Care Plans
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                            <Skeleton key={i} className="h-24 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (isError) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5" />
                        Care Plans
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        Failed to load care plans
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Care Plans ({carePlans?.length || 0})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {carePlans && carePlans.length > 0 ? (
                    <div className="space-y-4">
                        {carePlans.map((plan) => (
                            <div
                                key={plan.id}
                                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h4 className="font-medium">{getPlanTitle(plan)}</h4>
                                    <Badge className={getStatusColor(plan.status)}>
                                        {plan.status}
                                    </Badge>
                                </div>

                                {plan.description && (
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {plan.description}
                                    </p>
                                )}

                                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(plan.period?.start)} - {formatDate(plan.period?.end)}
                                    </span>
                                </div>

                                {/* Goals */}
                                {plan.goal && plan.goal.length > 0 && (
                                    <div className="mt-3 pt-3 border-t">
                                        <h5 className="text-sm font-medium flex items-center gap-1 mb-2">
                                            <Target className="h-3 w-3" />
                                            Goals
                                        </h5>
                                        <ul className="space-y-1">
                                            {plan.goal.slice(0, 3).map((goal, idx) => (
                                                <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                                    {goal.display || `Goal ${idx + 1}`}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Activities */}
                                {plan.activity && plan.activity.length > 0 && (
                                    <div className="mt-3 pt-3 border-t">
                                        <h5 className="text-sm font-medium mb-2">Activities</h5>
                                        <ul className="space-y-1">
                                            {plan.activity.slice(0, 3).map((activity, idx) => (
                                                <li key={idx} className="text-sm text-muted-foreground">
                                                    • {activity.detail?.description ||
                                                        activity.detail?.code?.text ||
                                                        activity.detail?.code?.coding?.[0]?.display ||
                                                        `Activity ${idx + 1}`}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">
                        No active care plans
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
