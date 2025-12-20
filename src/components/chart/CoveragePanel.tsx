'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { usePatientCoverage } from '@/hooks/useFHIRData'
import { Shield, Building2, Calendar, CreditCard, AlertCircle } from 'lucide-react'
import type { Coverage } from '@medplum/fhirtypes'

interface CoveragePanelProps {
    patientId: string
}

export function CoveragePanel({ patientId }: CoveragePanelProps) {
    const { data: coverages, isLoading, isError } = usePatientCoverage(patientId)

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return ''
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            case 'draft': return 'bg-yellow-100 text-yellow-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getTypeDisplay = (coverage: Coverage) => {
        return coverage.type?.text ||
            coverage.type?.coding?.[0]?.display ||
            'Health Insurance'
    }

    const getPayerName = (coverage: Coverage) => {
        return coverage.payor?.[0]?.display || 'Payer not documented'
    }

    const getRelationship = (coverage: Coverage) => {
        return coverage.relationship?.text ||
            coverage.relationship?.coding?.[0]?.display ||
            'Self'
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Insurance Coverage
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                            <Skeleton key={i} className="h-20 w-full" />
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
                        <Shield className="h-5 w-5" />
                        Insurance Coverage
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        Failed to load coverage
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Insurance Coverage ({coverages?.length || 0})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {coverages && coverages.length > 0 ? (
                    <div className="space-y-4">
                        {coverages.map((coverage, index) => (
                            <div
                                key={coverage.id}
                                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                {index === 0 ? 'Primary' : `Secondary ${index}`}
                                            </Badge>
                                            <Badge className={getStatusColor(coverage.status)}>
                                                {coverage.status}
                                            </Badge>
                                        </div>
                                        <h4 className="font-medium mt-2">{getTypeDisplay(coverage)}</h4>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Building2 className="h-4 w-4" />
                                            <span>{getPayerName(coverage)}</span>
                                        </div>
                                        {coverage.subscriberId && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <CreditCard className="h-4 w-4" />
                                                <span>ID: {coverage.subscriberId}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-muted-foreground">
                                            <span className="text-xs uppercase tracking-wide">Relationship</span>
                                            <p>{getRelationship(coverage)}</p>
                                        </div>
                                        {coverage.period && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>
                                                    {formatDate(coverage.period.start)} - {formatDate(coverage.period.end) || 'Present'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Class Information (Copay, Deductible, etc.) */}
                                {coverage.class && coverage.class.length > 0 && (
                                    <div className="mt-3 pt-3 border-t">
                                        <div className="flex flex-wrap gap-2">
                                            {coverage.class.map((cls, idx) => (
                                                <Badge key={idx} variant="secondary" className="text-xs">
                                                    {cls.type?.text || cls.type?.coding?.[0]?.display || 'Class'}: {cls.value}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">
                        No insurance coverage on file
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
