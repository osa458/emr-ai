/**
 * useScribeSession Hook
 * 
 * React hook for managing AI Scribe sessions with full recording flow
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import type {
    ScribeSession,
    ScribeRecording,
    SessionConfig
} from '@/lib/ai-scribe/session-manager'
import {
    createSession,
    addRecording,
    updateSessionStatus,
    setTranscript,
    setExtraction,
    setSOAPNote,
    mergeTranscripts,
} from '@/lib/ai-scribe/session-manager'
import type { PatientContext, SOAPNote, ClinicalExtraction, Transcript } from '@/lib/ai-scribe'

interface UseScribeSessionOptions {
    patientId: string
    encounterId?: string
    patientContext?: PatientContext
    autoTranscribe?: boolean
    onTranscriptReady?: (transcript: Transcript) => void
    onSOAPGenerated?: (soap: SOAPNote) => void
    onError?: (error: string) => void
}

export function useScribeSession(options: UseScribeSessionOptions) {
    const {
        patientId,
        encounterId,
        patientContext,
        autoTranscribe = true,
        onTranscriptReady,
        onSOAPGenerated,
        onError,
    } = options

    const [session, setSession] = useState<ScribeSession>(() =>
        createSession({ patientId, encounterId, patientContext })
    )
    const [isRecording, setIsRecording] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const startTimeRef = useRef<number>(0)

    /**
     * Start audio recording
     */
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []
            startTimeRef.current = Date.now()

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                const url = URL.createObjectURL(blob)
                const duration = Math.round((Date.now() - startTimeRef.current) / 1000)

                const recording: Omit<ScribeRecording, 'id'> = {
                    blob,
                    url,
                    duration,
                    timestamp: new Date(),
                }

                setSession(prev => addRecording(prev, recording))

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop())

                // Auto-transcribe if enabled
                if (autoTranscribe) {
                    await transcribeRecording(blob)
                }
            }

            mediaRecorder.start(1000) // Collect data every second
            setIsRecording(true)
            setSession(prev => updateSessionStatus(prev, 'recording'))
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to start recording'
            onError?.(message)
            setSession(prev => updateSessionStatus(prev, 'error', message))
        }
    }, [autoTranscribe, onError])

    /**
     * Stop audio recording
     */
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }, [isRecording])

    /**
     * Transcribe a recording
     */
    const transcribeRecording = useCallback(async (audio: Blob) => {
        setIsProcessing(true)
        setSession(prev => updateSessionStatus(prev, 'transcribing'))

        try {
            const formData = new FormData()
            formData.append('audio', audio, 'recording.webm')

            const response = await fetch('/api/ai/scribe/transcribe', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                throw new Error('Transcription failed')
            }

            const { transcript } = await response.json()
            setSession(prev => setTranscript(prev, transcript))
            onTranscriptReady?.(transcript)

            return transcript
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Transcription failed'
            onError?.(message)
            setSession(prev => updateSessionStatus(prev, 'error', message))
            return null
        } finally {
            setIsProcessing(false)
        }
    }, [onTranscriptReady, onError])

    /**
     * Extract clinical information from transcript
     */
    const extractClinical = useCallback(async (transcriptText?: string) => {
        const text = transcriptText || session.transcript?.text || mergeTranscripts(session.recordings)

        if (!text) {
            onError?.('No transcript available')
            return null
        }

        setIsProcessing(true)
        setSession(prev => updateSessionStatus(prev, 'processing'))

        try {
            const response = await fetch('/api/ai/scribe/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript: text,
                    patientContext,
                }),
            })

            if (!response.ok) {
                throw new Error('Clinical extraction failed')
            }

            const { extraction } = await response.json()
            setSession(prev => setExtraction(prev, extraction))

            return extraction
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Extraction failed'
            onError?.(message)
            setSession(prev => updateSessionStatus(prev, 'error', message))
            return null
        } finally {
            setIsProcessing(false)
        }
    }, [session.transcript, session.recordings, patientContext, onError])

    /**
     * Generate SOAP note
     */
    const generateSOAP = useCallback(async (extraction?: ClinicalExtraction) => {
        const ext = extraction || session.extraction
        const transcript = session.transcript?.text || mergeTranscripts(session.recordings)

        if (!ext && !transcript) {
            onError?.('No extraction or transcript available')
            return null
        }

        setIsProcessing(true)
        setSession(prev => updateSessionStatus(prev, 'processing'))

        try {
            const response = await fetch('/api/ai/scribe/generate-soap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    encounterId,
                    extraction: ext,
                    transcript: ext ? undefined : transcript,
                    patientContext,
                    saveToFHIR: true,
                }),
            })

            if (!response.ok) {
                throw new Error('SOAP generation failed')
            }

            const { soap, documentReferenceId } = await response.json()
            setSession(prev => setSOAPNote(prev, soap, documentReferenceId))
            onSOAPGenerated?.(soap)

            return soap
        } catch (error) {
            const message = error instanceof Error ? error.message : 'SOAP generation failed'
            onError?.(message)
            setSession(prev => updateSessionStatus(prev, 'error', message))
            return null
        } finally {
            setIsProcessing(false)
        }
    }, [session.extraction, session.transcript, session.recordings, patientId, encounterId, patientContext, onSOAPGenerated, onError])

    /**
     * Full flow: Transcribe all recordings → Extract → Generate SOAP
     */
    const processSession = useCallback(async () => {
        setIsProcessing(true)

        try {
            // Step 1: Merge all transcripts
            const fullTranscript = session.transcript?.text || mergeTranscripts(session.recordings)

            if (!fullTranscript) {
                throw new Error('No transcript available')
            }

            // Step 2: Extract clinical info
            const extraction = await extractClinical(fullTranscript)
            if (!extraction) return null

            // Step 3: Generate SOAP
            const soap = await generateSOAP(extraction)
            return soap
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Processing failed'
            onError?.(message)
            return null
        } finally {
            setIsProcessing(false)
        }
    }, [session.transcript, session.recordings, extractClinical, generateSOAP, onError])

    /**
     * Reset session
     */
    const resetSession = useCallback(() => {
        setSession(createSession({ patientId, encounterId, patientContext }))
        setIsRecording(false)
        setIsProcessing(false)
    }, [patientId, encounterId, patientContext])

    return {
        session,
        isRecording,
        isProcessing,
        startRecording,
        stopRecording,
        transcribeRecording,
        extractClinical,
        generateSOAP,
        processSession,
        resetSession,
    }
}
