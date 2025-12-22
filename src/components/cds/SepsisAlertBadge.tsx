'use client'

import React from 'react'
import { Activity, AlertTriangle, Heart, Thermometer, Wind } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import type { SepsisScore } from '@/lib/cds/sepsis-scoring'
import { getRiskColor } from '@/lib/cds/sepsis-scoring'

interface SepsisAlertBadgeProps {
    riskLevel: 'low' | 'moderate' | 'high' | 'critical'
    qsofaScore: SepsisScore
    className?: string
}

function getRiskIcon(risk: 'low' | 'moderate' | 'high' | 'critical') {
    switch (risk) {
        case 'critical':
        case 'high':
            return <AlertTriangle className="h-3 w-3" />
        case 'moderate':
            return <Activity className="h-3 w-3" />
        default:
            return <Heart className="h-3 w-3" />
    }
}

export function SepsisAlertBadge({ riskLevel, qsofaScore, className = '' }: SepsisAlertBadgeProps) {
    // Don't show badge for low risk
    if (riskLevel === 'low') {
        return null
    }

    const badgeClasses = `${getRiskColor(riskLevel)} ${className} ${riskLevel === 'critical' ? 'animate-pulse' : ''
        }`

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge className={`flex items-center gap-1 cursor-help border ${badgeClasses}`}>
                        {getRiskIcon(riskLevel)}
                        <span className="font-semibold">
                            {riskLevel === 'critical' ? 'SEPSIS ALERT' :
                                riskLevel === 'high' ? 'Sepsis Risk' :
                                    'Sepsis Watch'}
                        </span>
                        <span className="text-xs opacity-80">qSOFA {qsofaScore.score}/3</span>
                    </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-2">
                        <div className="font-semibold">qSOFA Score: {qsofaScore.score}/3</div>
                        <div className="text-sm space-y-1">
                            {qsofaScore.components.map((comp, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <span className={comp.met ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                                        {comp.met ? '✓' : '○'} {comp.name}: {comp.value ?? 'N/A'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">({comp.criteria})</span>
                                </div>
                            ))}
                        </div>
                        <div className="text-xs pt-1 border-t">
                            {qsofaScore.recommendation}
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
