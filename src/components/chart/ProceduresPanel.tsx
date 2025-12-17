'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { usePatientProcedures } from '@/hooks/useFHIRData'
import { Scissors, Calendar, User, AlertCircle, ChevronDown, ChevronRight, MapPin, Clock, FileText, X } from 'lucide-react'
import type { Procedure } from '@medplum/fhirtypes'

interface ProceduresPanelProps {
    patientId: string
}

export function ProceduresPanel({ patientId }: ProceduresPanelProps) {
    const { data: procedures, isLoading, isError } = usePatientProcedures(patientId)
    const [expandedProcedure, setExpandedProcedure] = useState<string | null>(null)

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
                    <div className="space-y-2">
                        {procedures.map((proc) => {
                            const isExpanded = expandedProcedure === proc.id
                            const reasonCode = proc.reasonCode?.[0]?.text || proc.reasonCode?.[0]?.coding?.[0]?.display
                            const bodySite = proc.bodySite?.[0]?.text || proc.bodySite?.[0]?.coding?.[0]?.display
                            const outcome = proc.outcome?.text || proc.outcome?.coding?.[0]?.display
                            const complication = proc.complication?.[0]?.text || proc.complication?.[0]?.coding?.[0]?.display
                            const location = proc.location?.display
                            const encounter = proc.encounter?.display
                            
                            return (
                                <div
                                    key={proc.id}
                                    className={`border rounded-lg transition-colors ${isExpanded ? 'bg-blue-50 border-blue-200' : 'hover:bg-muted/50'}`}
                                >
                                    <button
                                        onClick={() => setExpandedProcedure(isExpanded ? null : proc.id || null)}
                                        className="w-full p-4 text-left"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-2">
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 mt-1 text-blue-600" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 mt-1 text-muted-foreground" />
                                                )}
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
                                                </div>
                                            </div>
                                            <Badge className={getStatusColor(proc.status)}>
                                                {proc.status || 'unknown'}
                                            </Badge>
                                        </div>
                                    </button>
                                    
                                    {isExpanded && (
                                        <div className="px-4 pb-4 pt-0 ml-6 border-t border-blue-200 mt-2">
                                            <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                                                {reasonCode && (
                                                    <div>
                                                        <span className="text-muted-foreground">Reason:</span>
                                                        <p className="font-medium">{reasonCode}</p>
                                                    </div>
                                                )}
                                                {bodySite && (
                                                    <div>
                                                        <span className="text-muted-foreground">Body Site:</span>
                                                        <p className="font-medium">{bodySite}</p>
                                                    </div>
                                                )}
                                                {outcome && (
                                                    <div>
                                                        <span className="text-muted-foreground">Outcome:</span>
                                                        <p className="font-medium">{outcome}</p>
                                                    </div>
                                                )}
                                                {complication && (
                                                    <div>
                                                        <span className="text-muted-foreground">Complication:</span>
                                                        <p className="font-medium text-red-600">{complication}</p>
                                                    </div>
                                                )}
                                                {location && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                                        <span>{location}</span>
                                                    </div>
                                                )}
                                                {encounter && (
                                                    <div className="flex items-center gap-1">
                                                        <FileText className="h-3 w-3 text-muted-foreground" />
                                                        <span>{encounter}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {proc.note?.[0]?.text && (
                                                <div className="mt-3 p-2 bg-white rounded border">
                                                    <span className="text-xs text-muted-foreground">Notes:</span>
                                                    <p className="text-sm">{proc.note[0].text}</p>
                                                </div>
                                            )}
                                            {proc.report && proc.report.length > 0 && (
                                                <div className="mt-2">
                                                    <Button variant="outline" size="sm" className="text-xs">
                                                        <FileText className="h-3 w-3 mr-1" />
                                                        View Report
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
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
