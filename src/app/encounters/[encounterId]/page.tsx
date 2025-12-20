'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEncounter } from '@/hooks/useEncounter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import {
    ArrowLeft,
    Stethoscope,
    User,
    Calendar,
    Clock,
    MapPin,
    FileText,
    AlertCircle,
    ExternalLink
} from 'lucide-react'
import type { Encounter as FHIREncounter } from '@medplum/fhirtypes'

// Helper functions
function getPatientName(encounter: FHIREncounter): string {
    return encounter.subject?.display || encounter.subject?.reference?.split('/')[1] || 'Unknown Patient'
}

function getPatientId(encounter: FHIREncounter): string | null {
    const ref = encounter.subject?.reference
    if (ref?.startsWith('Patient/')) {
        return ref.replace('Patient/', '')
    }
    return null
}

function getPractitionerName(encounter: FHIREncounter): string {
    const participant = encounter.participant?.find(p =>
        p.type?.some(t => t.coding?.some(c => c.code === 'ATND' || c.code === 'primary'))
    ) || encounter.participant?.[0]
    return participant?.individual?.display || participant?.individual?.reference?.split('/')[1] || 'Not assigned'
}

function getEncounterType(encounter: FHIREncounter): string {
    return encounter.class?.display || encounter.class?.code || encounter.type?.[0]?.text || encounter.type?.[0]?.coding?.[0]?.display || 'Not specified'
}

function getEncounterReason(encounter: FHIREncounter): string {
    return encounter.reasonCode?.[0]?.text ||
        encounter.reasonCode?.[0]?.coding?.[0]?.display ||
        encounter.type?.[0]?.text ||
        'Not documented'
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return 'Not documented'
    try {
        return new Date(dateStr).toLocaleString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return dateStr
    }
}

function calculateDuration(encounter: FHIREncounter): string {
    if (!encounter.period?.start) return 'Not available'
    const start = new Date(encounter.period.start)
    const end = encounter.period.end ? new Date(encounter.period.end) : new Date()
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 60) return `${diffMins} minutes`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    if (hours < 24) return mins > 0 ? `${hours} hours ${mins} minutes` : `${hours} hours`
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? 's' : ''}`
}

const statusConfig: Record<string, { label: string; color: string }> = {
    planned: { label: 'Planned', color: 'bg-blue-100 text-blue-800' },
    arrived: { label: 'Arrived', color: 'bg-blue-100 text-blue-800' },
    triaged: { label: 'Triaged', color: 'bg-purple-100 text-purple-800' },
    'in-progress': { label: 'In Progress', color: 'bg-amber-100 text-amber-800' },
    onleave: { label: 'On Leave', color: 'bg-gray-100 text-gray-800' },
    finished: { label: 'Finished', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    'entered-in-error': { label: 'Error', color: 'bg-red-100 text-red-800' },
    unknown: { label: 'Unknown', color: 'bg-gray-100 text-gray-800' },
}

export default function EncounterDetailPage() {
    const params = useParams()
    const router = useRouter()
    const encounterId = params.encounterId as string

    const { data: encounter, isLoading, isError, error } = useEncounter(encounterId)

    if (isLoading) {
        return (
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <Card>
                    <CardContent className="p-6 space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex gap-4">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (isError || !encounter) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-red-700 mb-4">
                            <AlertCircle className="h-5 w-5" />
                            <span className="font-medium">Failed to load encounter</span>
                        </div>
                        <p className="text-sm text-red-600 mb-4">
                            {(error as Error)?.message || 'The encounter could not be found or there was an error loading it.'}
                        </p>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => router.back()}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Go Back
                            </Button>
                            <Link href="/encounters">
                                <Button>View All Encounters</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const patientId = getPatientId(encounter)
    const status = statusConfig[encounter.status || 'unknown'] || statusConfig.unknown

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Stethoscope className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Encounter Details</h1>
                            <p className="text-sm text-muted-foreground">ID: {encounter.id}</p>
                        </div>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                    {status.label}
                </span>
            </div>

            {/* Main Content */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Patient & Provider */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Patient & Provider
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-muted-foreground text-xs">Patient</Label>
                            <p className="text-sm font-medium">{getPatientName(encounter)}</p>
                            {patientId && (
                                <Link
                                    href={`/patients/${patientId}`}
                                    className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                                >
                                    View Patient Chart <ExternalLink className="h-3 w-3" />
                                </Link>
                            )}
                        </div>
                        <div>
                            <Label className="text-muted-foreground text-xs">Practitioner</Label>
                            <p className="text-sm">{getPractitionerName(encounter)}</p>
                        </div>
                        {encounter.serviceProvider?.display && (
                            <div>
                                <Label className="text-muted-foreground text-xs">Service Provider</Label>
                                <p className="text-sm">{encounter.serviceProvider.display}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Timing */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Timing
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-muted-foreground text-xs">Start Date</Label>
                            <p className="text-sm">{formatDate(encounter.period?.start)}</p>
                        </div>
                        {encounter.period?.end && (
                            <div>
                                <Label className="text-muted-foreground text-xs">End Date</Label>
                                <p className="text-sm">{formatDate(encounter.period.end)}</p>
                            </div>
                        )}
                        <div>
                            <Label className="text-muted-foreground text-xs">Duration</Label>
                            <p className="text-sm flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {calculateDuration(encounter)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Encounter Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-muted-foreground text-xs">Type / Class</Label>
                            <p className="text-sm capitalize">{getEncounterType(encounter)}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground text-xs">Reason</Label>
                            <p className="text-sm">{getEncounterReason(encounter)}</p>
                        </div>
                        {encounter.diagnosis?.[0]?.condition?.display && (
                            <div>
                                <Label className="text-muted-foreground text-xs">Diagnosis</Label>
                                <p className="text-sm">{encounter.diagnosis[0].condition.display}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Location */}
                {encounter.location?.[0]?.location && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Location
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">
                                {encounter.location[0].location.display ||
                                    encounter.location[0].location.reference?.split('/')[1] ||
                                    'Not specified'}
                            </p>
                            {encounter.location[0].status && (
                                <p className="text-xs text-muted-foreground mt-1 capitalize">
                                    Status: {encounter.location[0].status}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
                <Link href="/encounters">
                    <Button variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Encounters
                    </Button>
                </Link>
                {patientId && (
                    <Link href={`/patients/${patientId}`}>
                        <Button>
                            Open Patient Chart
                            <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    )
}
