'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { usePatientProcedures } from '@/hooks/useFHIRData'
import { Scissors, Calendar, User, AlertCircle } from 'lucide-react'
import type { Procedure } from '@medplum/fhirtypes'

interface ProceduresPanelProps {
    patientId: string
}

export function ProceduresPanel({ patientId }: ProceduresPanelProps) {
    const { data: procedures, isLoading, isError } = usePatientProcedures(patientId)

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Unknown date'
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800'
            case 'in-progress': return 'bg-blue-100 text-blue-800'
            case 'not-done': return 'bg-gray-100 text-gray-800'
            case 'preparation': return 'bg-yellow-100 text-yellow-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getProcedureName = (proc: Procedure) => {
        return proc.code?.text || proc.code?.coding?.[0]?.display || 'Unknown Procedure'
    }

    const getPerformer = (proc: Procedure) => {
        return proc.performer?.[0]?.actor?.display || 'Unknown'
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Scissors className="h-5 w-5" />
                        Procedures
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-16 w-full" />
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
                        <Scissors className="h-5 w-5" />
                        Procedures
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        Failed to load procedures
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Scissors className="h-5 w-5" />
                    Procedures ({procedures?.length || 0})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {procedures && procedures.length > 0 ? (
                    <div className="space-y-3">
                        {procedures.map((proc) => (
                            <div
                                key={proc.id}
                                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h4 className="font-medium">{getProcedureName(proc)}</h4>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(proc.performedDateTime || proc.performedPeriod?.start)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {getPerformer(proc)}
                                            </span>
                                        </div>
                                        {proc.note?.[0]?.text && (
                                            <p className="text-sm text-muted-foreground mt-2">
                                                {proc.note[0].text}
                                            </p>
                                        )}
                                    </div>
                                    <Badge className={getStatusColor(proc.status)}>
                                        {proc.status || 'unknown'}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">
                        No procedures recorded
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
