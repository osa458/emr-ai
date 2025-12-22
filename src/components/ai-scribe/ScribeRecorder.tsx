'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Square, Play, Pause, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScribeRecorderProps {
    isRecording: boolean
    isProcessing: boolean
    onStartRecording: () => void
    onStopRecording: () => void
    duration?: number
    className?: string
}

export function ScribeRecorder({
    isRecording,
    isProcessing,
    onStartRecording,
    onStopRecording,
    duration = 0,
    className = '',
}: ScribeRecorderProps) {
    const [elapsedTime, setElapsedTime] = useState(0)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (isRecording) {
            setElapsedTime(0)
            intervalRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1)
            }, 1000)
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [isRecording])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <Card className={cn('relative overflow-hidden', className)}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Recording Button */}
                        <Button
                            size="lg"
                            variant={isRecording ? 'destructive' : 'default'}
                            className={cn(
                                'h-14 w-14 rounded-full p-0',
                                isRecording && 'animate-pulse'
                            )}
                            onClick={isRecording ? onStopRecording : onStartRecording}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : isRecording ? (
                                <Square className="h-6 w-6" />
                            ) : (
                                <Mic className="h-6 w-6" />
                            )}
                        </Button>

                        {/* Status and Timer */}
                        <div>
                            <div className="flex items-center gap-2">
                                {isRecording && (
                                    <Badge variant="destructive" className="animate-pulse">
                                        <span className="mr-1.5 h-2 w-2 rounded-full bg-white animate-ping" />
                                        Recording
                                    </Badge>
                                )}
                                {isProcessing && (
                                    <Badge variant="secondary">
                                        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                        Processing
                                    </Badge>
                                )}
                                {!isRecording && !isProcessing && (
                                    <span className="text-sm text-muted-foreground">
                                        Click to start recording
                                    </span>
                                )}
                            </div>
                            {(isRecording || elapsedTime > 0) && (
                                <div className="font-mono text-2xl font-bold mt-1">
                                    {formatTime(isRecording ? elapsedTime : duration)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Visual indicator */}
                    {isRecording && (
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1 bg-red-500 rounded-full animate-pulse"
                                    style={{
                                        height: `${Math.random() * 24 + 8}px`,
                                        animationDelay: `${i * 0.1}s`,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Tips */}
                {!isRecording && !isProcessing && (
                    <div className="mt-3 text-xs text-muted-foreground">
                        💡 Speak clearly and mention patient symptoms, exam findings, assessment, and plan.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
