'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Activity, Heart, Thermometer, Wind, Brain, Droplet, AlertTriangle, CheckCircle } from 'lucide-react'
import type { SepsisRiskResult, ScoreComponent } from '@/lib/cds/sepsis-scoring'
import { getRiskColor } from '@/lib/cds/sepsis-scoring'

interface SepsisRiskPanelProps {
    data: SepsisRiskResult
    showRecommendations?: boolean
}

function getComponentIcon(name: string) {
    if (name.includes('Heart') || name.includes('HR')) return <Heart className="h-4 w-4" />
    if (name.includes('Respiratory') || name.includes('RR')) return <Wind className="h-4 w-4" />
    if (name.includes('Temperature') || name.includes('Temp')) return <Thermometer className="h-4 w-4" />
    if (name.includes('Mental') || name.includes('Consciousness')) return <Brain className="h-4 w-4" />
    if (name.includes('BP') || name.includes('Systolic')) return <Activity className="h-4 w-4" />
    if (name.includes('WBC') || name.includes('Lactate')) return <Droplet className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
}

function ScoreCard({ name, score, maxScore, riskLevel, components, recommendation }: {
    name: string
    score: number
    maxScore: number
    riskLevel: 'low' | 'moderate' | 'high' | 'critical'
    components: ScoreComponent[]
    recommendation: string
}) {
    const percentage = (score / maxScore) * 100

    return (
        <div className={`rounded-lg border p-3 ${getRiskColor(riskLevel)}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{name}</span>
                <Badge className={getRiskColor(riskLevel)}>
                    {score}/{maxScore}
                </Badge>
            </div>

            <Progress value={percentage} className="h-2 mb-3" />

            <div className="space-y-1 text-sm">
                {components.map((comp, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {getComponentIcon(comp.name)}
                            <span className={comp.met ? 'font-medium' : 'text-muted-foreground'}>
                                {comp.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                                {comp.value !== undefined ? String(comp.value) : 'N/A'}
                            </span>
                            {comp.met ? (
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                            ) : (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function SepsisRiskPanel({ data, showRecommendations = true }: SepsisRiskPanelProps) {
    const { overallRisk, scores, recommendations } = data

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Sepsis Risk Assessment
                    </CardTitle>
                    <Badge className={`${getRiskColor(overallRisk)} text-sm px-3 py-1`}>
                        {overallRisk.toUpperCase()} RISK
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Scoring Systems */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ScoreCard {...scores.qsofa} />
                    <ScoreCard {...scores.sirs} />
                    <ScoreCard {...scores.news2} />
                </div>

                {/* Recommendations */}
                {showRecommendations && recommendations.length > 0 && (
                    <div className={`rounded-lg border p-3 ${overallRisk === 'critical' || overallRisk === 'high'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}>
                        <div className="font-medium mb-2">Recommendations</div>
                        <ul className="space-y-1 text-sm">
                            {recommendations.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
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
