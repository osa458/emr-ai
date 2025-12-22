'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Clock, User } from 'lucide-react'
import type { Transcript } from '@/lib/ai-scribe'

interface TranscriptViewerProps {
    transcript: Transcript
    className?: string
}

export function TranscriptViewer({ transcript, className = '' }: TranscriptViewerProps) {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4" />
                        Transcript
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {transcript.duration && (
                            <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTime(transcript.duration)}
                            </Badge>
                        )}
                        {transcript.language && (
                            <Badge variant="outline" className="text-xs">
                                {transcript.language.toUpperCase()}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] overflow-y-auto pr-4">
                    {transcript.segments && transcript.segments.length > 0 ? (
                        <div className="space-y-3">
                            {transcript.segments.map((segment) => (
                                <div key={segment.id} className="flex gap-3">
                                    <div className="text-xs text-muted-foreground font-mono w-12 flex-shrink-0 pt-0.5">
                                        {formatTime(segment.start)}
                                    </div>
                                    <div className="flex-1">
                                        {segment.speaker && (
                                            <div className="flex items-center gap-1 mb-0.5">
                                                <User className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    {segment.speaker}
                                                </span>
                                            </div>
                                        )}
                                        <p className="text-sm">{segment.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm whitespace-pre-wrap">{transcript.text}</div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
