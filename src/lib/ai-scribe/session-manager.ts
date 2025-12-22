/**
 * AI Scribe Session Manager
 * 
 * Manages encounter-based scribe sessions with FHIR Media storage
 */

import type { Transcript, ClinicalExtraction, SOAPNote, PatientContext } from './ai-provider'

export interface ScribeSession {
    id: string
    patientId: string
    encounterId?: string
    status: 'idle' | 'recording' | 'transcribing' | 'processing' | 'complete' | 'error'
    startTime?: Date
    endTime?: Date
    recordings: ScribeRecording[]
    transcript?: Transcript
    extraction?: ClinicalExtraction
    soapNote?: SOAPNote
    savedNoteId?: string
    error?: string
}

export interface ScribeRecording {
    id: string
    blob?: Blob
    url?: string
    duration: number
    timestamp: Date
    transcript?: Transcript
    fhirMediaId?: string
}

export interface SessionConfig {
    patientId: string
    encounterId?: string
    patientContext?: PatientContext
    autoTranscribe?: boolean
    autoExtract?: boolean
    autoGenerateSOAP?: boolean
}

/**
 * Create a new scribe session
 */
export function createSession(config: SessionConfig): ScribeSession {
    return {
        id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patientId: config.patientId,
        encounterId: config.encounterId,
        status: 'idle',
        recordings: [],
    }
}

/**
 * Add recording to session
 */
export function addRecording(session: ScribeSession, recording: Omit<ScribeRecording, 'id'>): ScribeSession {
    const newRecording: ScribeRecording = {
        ...recording,
        id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }

    return {
        ...session,
        recordings: [...session.recordings, newRecording],
    }
}

/**
 * Update session status
 */
export function updateSessionStatus(
    session: ScribeSession,
    status: ScribeSession['status'],
    error?: string
): ScribeSession {
    return {
        ...session,
        status,
        error,
    }
}

/**
 * Set session transcript
 */
export function setTranscript(session: ScribeSession, transcript: Transcript): ScribeSession {
    return {
        ...session,
        transcript,
    }
}

/**
 * Set session extraction
 */
export function setExtraction(session: ScribeSession, extraction: ClinicalExtraction): ScribeSession {
    return {
        ...session,
        extraction,
    }
}

/**
 * Set session SOAP note
 */
export function setSOAPNote(session: ScribeSession, soapNote: SOAPNote, savedNoteId?: string): ScribeSession {
    return {
        ...session,
        soapNote,
        savedNoteId,
        status: 'complete',
        endTime: new Date(),
    }
}

/**
 * Merge multiple transcripts from recordings
 */
export function mergeTranscripts(recordings: ScribeRecording[]): string {
    return recordings
        .filter(r => r.transcript?.text)
        .map(r => r.transcript!.text)
        .join('\n\n')
}

/**
 * Calculate total recording duration
 */
export function getTotalDuration(recordings: ScribeRecording[]): number {
    return recordings.reduce((sum, r) => sum + r.duration, 0)
}

/**
 * Format session for display
 */
export function formatSessionSummary(session: ScribeSession): {
    status: string
    recordingCount: number
    totalDuration: string
    hasTranscript: boolean
    hasSOAP: boolean
} {
    const totalSeconds = getTotalDuration(session.recordings)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    return {
        status: session.status,
        recordingCount: session.recordings.length,
        totalDuration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
        hasTranscript: !!session.transcript,
        hasSOAP: !!session.soapNote,
    }
}
