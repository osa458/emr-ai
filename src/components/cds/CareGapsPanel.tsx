'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    ClipboardCheck,
    Syringe,
    TestTube,
    Calendar,
    AlertCircle,
    CheckCircle2,
    ChevronRight
} from 'lucide-react'
import type { CareGapsResult, CareGap } from '@/lib/cds/care-gaps'
import { getGapPriorityColor } from '@/lib/cds/care-gaps'

interface CareGapsPanelProps {
    data: CareGapsResult
    onOrderClick?: (orderCode: string) => void
    compact?: boolean
}

function getCategoryIcon(category: CareGap['category']) {
    switch (category) {
        case 'screening':
            return <ClipboardCheck className="h-4 w-4" />
        case 'immunization':
            return <Syringe className="h-4 w-4" />
        case 'chronic-care':
            return <TestTube className="h-4 w-4" />
        case 'follow-up':
            return <Calendar className="h-4 w-4" />
        default:
            return <AlertCircle className="h-4 w-4" />
    }
}

function CareGapItem({ gap, onOrderClick }: { gap: CareGap; onOrderClick?: (code: string) => void }) {
    return (
        <div className={`rounded-lg border p-3 ${getGapPriorityColor(gap.priority)}`}>
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                    {getCategoryIcon(gap.category)}
                    <div>
                        <div className="font-medium text-sm">{gap.name}</div>
                        <div className="text-xs opacity-80">{gap.description}</div>
                        <div className="text-xs mt-1">{gap.recommendation}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className={`${getGapPriorityColor(gap.priority)} text-xs`}>
                        {gap.priority === 'overdue' ? 'OVERDUE' : gap.priority.toUpperCase()}
                    </Badge>
                    {gap.orderCode && onOrderClick && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => onOrderClick(gap.orderCode!)}
                        >
                            Order
                            <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
            <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
            <span className="text-sm">{message}</span>
        </div>
    )
}

export function CareGapsPanel({ data, onOrderClick, compact = false }: CareGapsPanelProps) {
    const { gaps, totalGaps, overdueCount } = data

    if (compact) {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4" />
                        <span className="font-medium text-sm">Care Gaps</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {overdueCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                                {overdueCount} Overdue
                            </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                            {totalGaps} Total
                        </Badge>
                    </div>
                </div>
                {totalGaps > 0 ? (
                    <div className="space-y-1">
                        {[...gaps.screenings, ...gaps.immunizations, ...gaps.chronicCare]
                            .filter(g => g.priority === 'overdue' || g.priority === 'high')
                            .slice(0, 3)
                            .map(gap => (
                                <div key={gap.id} className={`rounded p-2 text-xs ${getGapPriorityColor(gap.priority)}`}>
                                    {gap.name}
                                </div>
                            ))}
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Up to date on preventive care
                    </div>
                )}
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5" />
                        Care Gaps
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {overdueCount > 0 && (
                            <Badge variant="destructive">
                                {overdueCount} Overdue
                            </Badge>
                        )}
                        <Badge variant="secondary">
                            {totalGaps} Gap{totalGaps !== 1 ? 's' : ''}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="screenings">
                    <TabsList className="grid grid-cols-4 w-full">
                        <TabsTrigger value="screenings" className="text-xs">
                            <ClipboardCheck className="h-3 w-3 mr-1" />
                            Screenings ({gaps.screenings.length})
                        </TabsTrigger>
                        <TabsTrigger value="immunizations" className="text-xs">
                            <Syringe className="h-3 w-3 mr-1" />
                            Vaccines ({gaps.immunizations.length})
                        </TabsTrigger>
                        <TabsTrigger value="chronic" className="text-xs">
                            <TestTube className="h-3 w-3 mr-1" />
                            Monitoring ({gaps.chronicCare.length})
                        </TabsTrigger>
                        <TabsTrigger value="followup" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            Follow-up ({gaps.followUps.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="screenings" className="space-y-2 mt-4">
                        {gaps.screenings.length > 0 ? (
                            gaps.screenings.map(gap => (
                                <CareGapItem key={gap.id} gap={gap} onOrderClick={onOrderClick} />
                            ))
                        ) : (
                            <EmptyState message="All recommended screenings are up to date" />
                        )}
                    </TabsContent>

                    <TabsContent value="immunizations" className="space-y-2 mt-4">
                        {gaps.immunizations.length > 0 ? (
                            gaps.immunizations.map(gap => (
                                <CareGapItem key={gap.id} gap={gap} onOrderClick={onOrderClick} />
                            ))
                        ) : (
                            <EmptyState message="All recommended immunizations are up to date" />
                        )}
                    </TabsContent>

                    <TabsContent value="chronic" className="space-y-2 mt-4">
                        {gaps.chronicCare.length > 0 ? (
                            gaps.chronicCare.map(gap => (
                                <CareGapItem key={gap.id} gap={gap} onOrderClick={onOrderClick} />
                            ))
                        ) : (
                            <EmptyState message="All chronic care monitoring is up to date" />
                        )}
                    </TabsContent>

                    <TabsContent value="followup" className="space-y-2 mt-4">
                        {gaps.followUps.length > 0 ? (
                            gaps.followUps.map(gap => (
                                <CareGapItem key={gap.id} gap={gap} onOrderClick={onOrderClick} />
                            ))
                        ) : (
                            <EmptyState message="No pending follow-ups" />
                        )}
                    </TabsContent>
                </Tabs>

                <div className="text-xs text-muted-foreground text-right mt-4">
                    Last updated: {new Date(data.timestamp).toLocaleString()}
                </div>
            </CardContent>
        </Card>
    )
}
