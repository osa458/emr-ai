'use client'

import React from 'react'
import {
    AlertTriangle,
    Shield,
    Activity,
    ClipboardCheck,
    ChevronRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export interface CDSAlert {
    id: string
    type: 'drug-interaction' | 'allergy' | 'sepsis' | 'fall-risk' | 'care-gap'
    severity: 'low' | 'moderate' | 'high' | 'critical'
    title: string
    description?: string
    link?: string
}

interface CDSAlertBannerProps {
    alerts: CDSAlert[]
    patientId?: string
    className?: string
}

function getAlertIcon(type: CDSAlert['type']) {
    switch (type) {
        case 'drug-interaction':
        case 'allergy':
            return <Shield className="h-4 w-4" />
        case 'sepsis':
            return <Activity className="h-4 w-4" />
        case 'fall-risk':
            return <AlertTriangle className="h-4 w-4" />
        case 'care-gap':
            return <ClipboardCheck className="h-4 w-4" />
        default:
            return <AlertTriangle className="h-4 w-4" />
    }
}

function getSeverityStyles(severity: CDSAlert['severity']) {
    switch (severity) {
        case 'critical':
            return 'bg-purple-100 border-purple-400 text-purple-900'
        case 'high':
            return 'bg-red-100 border-red-400 text-red-900'
        case 'moderate':
            return 'bg-orange-100 border-orange-400 text-orange-900'
        case 'low':
            return 'bg-yellow-100 border-yellow-400 text-yellow-900'
        default:
            return 'bg-gray-100 border-gray-400 text-gray-900'
    }
}

function getSeverityBadgeStyles(severity: CDSAlert['severity']) {
    switch (severity) {
        case 'critical':
            return 'bg-purple-600 text-white'
        case 'high':
            return 'bg-red-600 text-white'
        case 'moderate':
            return 'bg-orange-600 text-white'
        case 'low':
            return 'bg-yellow-600 text-white'
        default:
            return 'bg-gray-600 text-white'
    }
}

export function CDSAlertBanner({ alerts, patientId, className = '' }: CDSAlertBannerProps) {
    if (alerts.length === 0) {
        return null
    }

    // Sort by severity (critical first)
    const severityOrder = { 'critical': 0, 'high': 1, 'moderate': 2, 'low': 3 }
    const sortedAlerts = [...alerts].sort((a, b) =>
        severityOrder[a.severity] - severityOrder[b.severity]
    )

    const highestSeverity = sortedAlerts[0].severity
    const criticalCount = alerts.filter(a => a.severity === 'critical').length
    const highCount = alerts.filter(a => a.severity === 'high').length

    return (
        <div className={`border-2 rounded-lg p-3 ${getSeverityStyles(highestSeverity)} ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${highestSeverity === 'critical' ? 'bg-purple-200' :
                            highestSeverity === 'high' ? 'bg-red-200' :
                                highestSeverity === 'moderate' ? 'bg-orange-200' :
                                    'bg-yellow-200'
                        }`}>
                        <AlertTriangle className="h-5 w-5" />
                    </div>

                    <div>
                        <div className="font-semibold flex items-center gap-2">
                            <span>{alerts.length} Clinical Decision Support Alert{alerts.length > 1 ? 's' : ''}</span>
                            {criticalCount > 0 && (
                                <Badge className={getSeverityBadgeStyles('critical')}>
                                    {criticalCount} Critical
                                </Badge>
                            )}
                            {highCount > 0 && (
                                <Badge className={getSeverityBadgeStyles('high')}>
                                    {highCount} High
                                </Badge>
                            )}
                        </div>
                        <div className="text-sm opacity-80 flex items-center gap-4 mt-1">
                            {sortedAlerts.slice(0, 3).map((alert, idx) => (
                                <div key={alert.id} className="flex items-center gap-1">
                                    {getAlertIcon(alert.type)}
                                    <span>{alert.title}</span>
                                </div>
                            ))}
                            {alerts.length > 3 && (
                                <span className="text-sm">+{alerts.length - 3} more</span>
                            )}
                        </div>
                    </div>
                </div>

                {patientId && (
                    <Link href={`/patients/${patientId}?tab=cds`}>
                        <Button variant="ghost" size="sm" className="text-current hover:bg-white/30">
                            View All
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    )
}

// Helper to aggregate CDS results into unified alerts
export function aggregateCDSAlerts(
    drugInteractionCount: number,
    allergyAlertCount: number,
    hasSevereInteractions: boolean
): CDSAlert[] {
    const alerts: CDSAlert[] = []

    if (allergyAlertCount > 0) {
        alerts.push({
            id: 'allergy-alerts',
            type: 'allergy',
            severity: 'high',
            title: `${allergyAlertCount} Allergy Alert${allergyAlertCount > 1 ? 's' : ''}`,
        })
    }

    if (drugInteractionCount > 0) {
        alerts.push({
            id: 'drug-interactions',
            type: 'drug-interaction',
            severity: hasSevereInteractions ? 'high' : 'moderate',
            title: `${drugInteractionCount} Drug Interaction${drugInteractionCount > 1 ? 's' : ''}`,
        })
    }

    return alerts
}
