'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    AlertTriangle,
    Shield,
    Home,
    Bed,
    ChevronDown,
    ChevronUp
} from 'lucide-react'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from '@/components/ui/collapsible'
import type { RiskScoresResult, RiskScore } from '@/lib/cds/risk-models'
import { getRiskLevelColor } from '@/lib/cds/risk-models'

interface RiskScoresPanelProps {
    data: RiskScoresResult
    compact?: boolean
}

function getScoreIcon(name: string) {
    if (name.includes('Fall')) return <AlertTriangle className="h-4 w-4" />
    if (name.includes('LACE') || name.includes('Readmission')) return <Home className="h-4 w-4" />
    if (name.includes('Braden') || name.includes('Pressure')) return <Bed className="h-4 w-4" />
    return <Shield className="h-4 w-4" />
}

function RiskScoreCard({ score, compact = false }: { score: RiskScore; compact?: boolean }) {
    const [isOpen, setIsOpen] = React.useState(false)

    // Calculate percentage - adjust for Braden where lower is higher risk
    const percentage = score.name.includes('Braden')
        ? ((score.maxScore! - score.score) / (score.maxScore! - (score.minScore ?? 0))) * 100
        : (score.score / score.maxScore) * 100

    return (
        <div className={`rounded-lg border p-3 ${getRiskLevelColor(score.riskLevel)}`}>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-2">
                            {getScoreIcon(score.name)}
                            <span className="font-semibold text-sm">{score.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className={`${getRiskLevelColor(score.riskLevel)} text-xs`}>
                                {score.score}{score.minScore !== undefined ? `/${score.maxScore}` : ''}
                            </Badge>
                            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                    </div>
                </CollapsibleTrigger>

                <div className="mt-2">
                    <Progress value={percentage} className="h-2" />
                    <p className="text-xs mt-1 opacity-80">{score.interpretation}</p>
                </div>

                <CollapsibleContent className="pt-2">
                    <div className="space-y-1 text-sm border-t pt-2 mt-2">
                        <p className="font-medium text-xs">Recommendations:</p>
                        <ul className="list-disc list-inside space-y-1">
                            {score.recommendations.map((rec, idx) => (
                                <li key={idx} className="text-xs">{rec}</li>
                            ))}
                        </ul>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
}

export function RiskScoresPanel({ data, compact = false }: RiskScoresPanelProps) {
    const { overallRisk, scores, primaryRecommendations } = data

    if (compact) {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium text-sm">Risk Scores</span>
                    <Badge className={`${getRiskLevelColor(overallRisk)} text-xs`}>
                        {overallRisk.toUpperCase()}
                    </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {Object.entries(scores).map(([key, score]) => (
                        <div key={key} className={`rounded p-2 text-center text-xs ${getRiskLevelColor(score.riskLevel)}`}>
                            <div className="font-semibold">{score.score}</div>
                            <div className="opacity-80">{score.name.split(' ')[0]}</div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Patient Risk Assessment
                    </CardTitle>
                    <Badge className={`${getRiskLevelColor(overallRisk)} text-sm px-3 py-1`}>
                        {overallRisk.toUpperCase()} RISK
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Risk Score Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <RiskScoreCard score={scores.fallRisk} compact={compact} />
                    <RiskScoreCard score={scores.readmissionRisk} compact={compact} />
                    <RiskScoreCard score={scores.pressureUlcerRisk} compact={compact} />
                </div>

                {/* Primary Recommendations */}
                {primaryRecommendations.length > 0 && (
                    <div className={`rounded-lg border p-3 ${overallRisk === 'very-high' || overallRisk === 'high'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}>
                        <div className="font-medium mb-2 text-sm">Priority Actions</div>
                        <ul className="space-y-1">
                            {primaryRecommendations.map((rec, idx) => (
                                <li key={idx} className="text-sm">{rec}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Timestamp */}
                <div className="text-xs text-muted-foreground text-right">
                    Last updated: {new Date(data.timestamp).toLocaleString()}
                </div>
            </CardContent>
        </Card>
    )
}
