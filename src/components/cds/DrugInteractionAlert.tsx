'use client'

import React, { useState } from 'react'
import { AlertTriangle, X, ChevronDown, ChevronUp, Shield, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from '@/components/ui/collapsible'
import type { DrugInteraction, DrugAllergyAlert } from '@/lib/drug-interactions'
import { getSeverityColor } from '@/lib/drug-interactions'

interface DrugInteractionAlertProps {
    interactions: DrugInteraction[]
    allergyAlerts: DrugAllergyAlert[]
    onDismiss?: () => void
}

function getSeverityIcon(severity: string) {
    switch (severity) {
        case 'contraindicated':
            return <Shield className="h-4 w-4" />
        case 'major':
        case 'danger':
            return <AlertTriangle className="h-4 w-4" />
        default:
            return <Info className="h-4 w-4" />
    }
}

function getSeverityLabel(severity: string) {
    switch (severity) {
        case 'contraindicated':
            return 'CONTRAINDICATED'
        case 'major':
            return 'Major'
        case 'moderate':
            return 'Moderate'
        case 'minor':
            return 'Minor'
        case 'danger':
            return 'Allergy'
        case 'warning':
            return 'Cross-Reactivity'
        default:
            return severity
    }
}

export function DrugInteractionAlert({
    interactions,
    allergyAlerts,
    onDismiss
}: DrugInteractionAlertProps) {
    const [isOpen, setIsOpen] = useState(true)
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

    const hasContraindicated = interactions.some(i => i.severity === 'contraindicated')
    const hasMajor = interactions.some(i => i.severity === 'major') || allergyAlerts.some(a => a.severity === 'danger')

    if (interactions.length === 0 && allergyAlerts.length === 0) {
        return null
    }

    const toggleItem = (id: string) => {
        const newExpanded = new Set(expandedItems)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedItems(newExpanded)
    }

    return (
        <div className={`rounded-lg border-2 mb-4 ${hasContraindicated
                ? 'border-purple-400 bg-purple-50'
                : hasMajor
                    ? 'border-red-400 bg-red-50'
                    : 'border-orange-400 bg-orange-50'
            }`}>
            <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-5 w-5 ${hasContraindicated ? 'text-purple-600' : hasMajor ? 'text-red-600' : 'text-orange-600'
                        }`} />
                    <span className="font-semibold">
                        {allergyAlerts.length > 0 && (
                            <span className="text-red-700">{allergyAlerts.length} Allergy Alert{allergyAlerts.length > 1 ? 's' : ''}</span>
                        )}
                        {allergyAlerts.length > 0 && interactions.length > 0 && ' • '}
                        {interactions.length > 0 && (
                            <span className={hasContraindicated ? 'text-purple-700' : 'text-orange-700'}>
                                {interactions.length} Drug Interaction{interactions.length > 1 ? 's' : ''}
                            </span>
                        )}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsOpen(!isOpen)}
                        className="h-8 px-2"
                    >
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    {onDismiss && (
                        <Button variant="ghost" size="sm" onClick={onDismiss} className="h-8 px-2">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {isOpen && (
                <div className="px-3 pb-3 space-y-2">
                    {/* Allergy Alerts */}
                    {allergyAlerts.map((alert, idx) => (
                        <Collapsible
                            key={`allergy-${idx}`}
                            open={expandedItems.has(`allergy-${idx}`)}
                            onOpenChange={() => toggleItem(`allergy-${idx}`)}
                        >
                            <div className={`rounded-md border p-2 ${getSeverityColor(alert.severity)}`}>
                                <CollapsibleTrigger asChild>
                                    <div className="flex items-center justify-between cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            {getSeverityIcon(alert.severity)}
                                            <Badge variant="destructive" className="text-xs">
                                                {getSeverityLabel(alert.severity)}
                                            </Badge>
                                            <span className="font-medium">
                                                {alert.drug} — {alert.crossReactivity ? 'Cross-reactive with' : 'Direct allergy to'} {alert.allergen}
                                            </span>
                                        </div>
                                        <ChevronDown className="h-4 w-4" />
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pt-2">
                                    <div className="text-sm space-y-1">
                                        <p><strong>Description:</strong> {alert.description}</p>
                                        <p><strong>Recommendation:</strong> {alert.recommendation}</p>
                                    </div>
                                </CollapsibleContent>
                            </div>
                        </Collapsible>
                    ))}

                    {/* Drug Interactions */}
                    {interactions.map((interaction, idx) => (
                        <Collapsible
                            key={`interaction-${idx}`}
                            open={expandedItems.has(`interaction-${idx}`)}
                            onOpenChange={() => toggleItem(`interaction-${idx}`)}
                        >
                            <div className={`rounded-md border p-2 ${getSeverityColor(interaction.severity)}`}>
                                <CollapsibleTrigger asChild>
                                    <div className="flex items-center justify-between cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            {getSeverityIcon(interaction.severity)}
                                            <Badge
                                                variant="outline"
                                                className={`text-xs ${getSeverityColor(interaction.severity)}`}
                                            >
                                                {getSeverityLabel(interaction.severity)}
                                            </Badge>
                                            <span className="font-medium">
                                                {interaction.drug1} + {interaction.drug2}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                — {interaction.description}
                                            </span>
                                        </div>
                                        <ChevronDown className="h-4 w-4" />
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pt-2">
                                    <div className="text-sm space-y-1">
                                        <p><strong>Clinical Effect:</strong> {interaction.clinicalEffect}</p>
                                        <p><strong>Recommendation:</strong> {interaction.recommendation}</p>
                                    </div>
                                </CollapsibleContent>
                            </div>
                        </Collapsible>
                    ))}
                </div>
            )}
        </div>
    )
}
