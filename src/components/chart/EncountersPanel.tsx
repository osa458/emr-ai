'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Stethoscope,
    Calendar,
    Clock,
    User,
    ArrowRight,
    AlertCircle
} from 'lucide-react'
import { usePatientEncounters } from '@/hooks/useEncounter'
import Link from 'next/link'

interface EncountersPanelProps {
    patientId: string
}

export function EncountersPanel({ patientId }: EncountersPanelProps) {
    const { data: encounters = [], isLoading, isError } = usePatientEncounters(patientId)

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5" />
                        Encounters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (isError) {
        return (
            <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-5 w-5" />
                        <span>Failed to load encounters</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Patient Encounters</h2>
                <Button>
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Start New Encounter
                </Button>
            </div>

            <div className="grid gap-4">
                {encounters.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            No encounters found for this patient.
                        </CardContent>
                    </Card>
                ) : (
                    encounters.map((encounter) => {
                        const date = encounter.period?.start
                            ? new Date(encounter.period.start)
                            : null

                        const type = encounter.type?.[0]?.text || encounter.type?.[0]?.coding?.[0]?.display || 'General Encounter'
                        const status = encounter.status
                        const practitioner = encounter.participant?.[0]?.individual?.display || 'Practitioner not documented'
                        const encounterId = encounter.id

                        return (
                            <Card key={encounterId} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-lg">{type}</h3>
                                                <Badge variant={
                                                    status === 'in-progress' ? 'default' :
                                                        status === 'finished' ? 'secondary' : 'outline'
                                                }>
                                                    {status}
                                                </Badge>
                                            </div>

                                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                {date && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>{date.toLocaleDateString()}</span>
                                                        <Clock className="h-4 w-4 ml-1" />
                                                        <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <User className="h-4 w-4" />
                                                    <span>{practitioner}</span>
                                                </div>
                                            </div>

                                            {encounter.reasonCode?.[0] && (
                                                <div className="text-sm mt-2">
                                                    <span className="font-medium">Reason: </span>
                                                    {encounter.reasonCode[0].text || encounter.reasonCode[0].coding?.[0]?.display}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Link href={`/encounters/${encounterId}`}>
                                                <Button variant="outline" size="sm">
                                                    View details
                                                    <ArrowRight className="h-4 w-4 ml-2" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    )
}
