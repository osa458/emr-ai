'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Mic,
    FileText,
    Sparkles,
    ArrowRight,
    Loader2,
    CheckCircle,
    AlertCircle,
    RefreshCw,
} from 'lucide-react'
import { useScribeSession } from '@/hooks/useScribeSession'
import { ScribeRecorder } from './ScribeRecorder'
import { TranscriptViewer } from './TranscriptViewer'
import { SOAPEditor } from './SOAPEditor'
import type { PatientContext, SOAPNote } from '@/lib/ai-scribe'
import { cn } from '@/lib/utils'

interface ScribePanelProps {
    patientId: string
    patientName?: string
    encounterId?: string
    patientContext?: PatientContext
    onNoteGenerated?: (soap: SOAPNote, documentId?: string) => void
    className?: string
}

export function ScribePanel({
    patientId,
    patientName,
    encounterId,
    patientContext,
    onNoteGenerated,
    className = '',
}: ScribePanelProps) {
    const [activeTab, setActiveTab] = useState('record')
    const [error, setError] = useState<string | null>(null)

    const {
        session,
        isRecording,
        isProcessing,
        startRecording,
        stopRecording,
        extractClinical,
        generateSOAP,
        processSession,
        resetSession,
    } = useScribeSession({
        patientId,
        encounterId,
        patientContext,
        autoTranscribe: true,
        onTranscriptReady: () => {
            setActiveTab('transcript')
        },
        onSOAPGenerated: (soap) => {
            setActiveTab('soap')
            onNoteGenerated?.(soap, session.savedNoteId)
        },
        onError: (err) => setError(err),
    })

    const handleGenerateSOAP = async () => {
        setError(null)
        await processSession()
    }

    const getStepStatus = (step: 'record' | 'transcript' | 'soap') => {
        if (step === 'record') return session.recordings.length > 0 ? 'complete' : 'pending'
        if (step === 'transcript') return session.transcript ? 'complete' : 'pending'
        if (step === 'soap') return session.soapNote ? 'complete' : 'pending'
        return 'pending'
    }

    const totalDuration = session.recordings.reduce((sum, r) => sum + r.duration, 0)

    return (
        <Card className={cn('', className)}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Mic className="h-5 w-5" />
                        AI Scribe
                        {patientName && (
                            <span className="font-normal text-muted-foreground">
                                — {patientName}
                            </span>
                        )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {session.status === 'complete' && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Note Saved
                            </Badge>
                        )}
                        {session.status === 'error' && (
                            <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Error
                            </Badge>
                        )}
                        <Button variant="ghost" size="sm" onClick={resetSession}>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            New Session
                        </Button>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-2 mt-4">
                    {(['record', 'transcript', 'soap'] as const).map((step, i) => {
                        const status = getStepStatus(step)
                        const labels = { record: 'Record', transcript: 'Transcript', soap: 'SOAP Note' }

                        return (
                            <React.Fragment key={step}>
                                <button
                                    onClick={() => setActiveTab(step)}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors',
                                        activeTab === step
                                            ? 'bg-primary text-primary-foreground'
                                            : status === 'complete'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-muted text-muted-foreground'
                                    )}
                                >
                                    {status === 'complete' && <CheckCircle className="h-3 w-3" />}
                                    {labels[step]}
                                </button>
                                {i < 2 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                            </React.Fragment>
                        )
                    })}
                </div>
            </CardHeader>

            <CardContent>
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="hidden">
                        <TabsTrigger value="record">Record</TabsTrigger>
                        <TabsTrigger value="transcript">Transcript</TabsTrigger>
                        <TabsTrigger value="soap">SOAP</TabsTrigger>
                    </TabsList>

                    <TabsContent value="record" className="mt-0 space-y-4">
                        <ScribeRecorder
                            isRecording={isRecording}
                            isProcessing={isProcessing}
                            onStartRecording={startRecording}
                            onStopRecording={stopRecording}
                            duration={totalDuration}
                        />

                        {/* Recordings List */}
                        {session.recordings.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-sm font-medium">
                                    Recordings ({session.recordings.length})
                                </div>
                                {session.recordings.map((rec, i) => (
                                    <div
                                        key={rec.id}
                                        className="flex items-center justify-between p-2 rounded border bg-muted/30"
                                    >
                                        <span className="text-sm">
                                            Recording {i + 1} — {Math.floor(rec.duration / 60)}:{(rec.duration % 60).toString().padStart(2, '0')}
                                        </span>
                                        {rec.transcript && (
                                            <Badge variant="outline" className="text-xs">
                                                Transcribed
                                            </Badge>
                                        )}
                                    </div>
                                ))}

                                <Button
                                    onClick={handleGenerateSOAP}
                                    disabled={isProcessing || !session.transcript}
                                    className="w-full mt-4"
                                >
                                    {isProcessing ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-4 w-4 mr-2" />
                                    )}
                                    Generate SOAP Note
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="transcript" className="mt-0 space-y-4">
                        {session.transcript ? (
                            <>
                                <TranscriptViewer transcript={session.transcript} />
                                <Button
                                    onClick={handleGenerateSOAP}
                                    disabled={isProcessing}
                                    className="w-full"
                                >
                                    {isProcessing ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-4 w-4 mr-2" />
                                    )}
                                    Generate SOAP Note
                                </Button>
                            </>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No transcript yet. Record audio to get started.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="soap" className="mt-0">
                        {session.soapNote ? (
                            <SOAPEditor
                                soap={session.soapNote}
                                onSave={(soap) => {
                                    // Could re-save to FHIR here
                                    console.log('Updated SOAP:', soap)
                                }}
                            />
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>Record and transcribe audio to generate a SOAP note.</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
