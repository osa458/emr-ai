/**
 * AI Scribe SOAP Note Generation API
 * POST /api/ai/scribe/generate-soap
 * 
 * Generates SOAP note from clinical extraction or transcript
 */

import { NextRequest, NextResponse } from 'next/server'
import { getScribeProvider, type ClinicalExtraction, type PatientContext } from '@/lib/ai-scribe'

// FHIR helpers
const BASE_URL = process.env.AIDBOX_BASE_URL || 'https://aoadhslfxc.edge.aidbox.app'
const CLIENT_ID = process.env.AIDBOX_CLIENT_ID || 'emr-api'
const CLIENT_SECRET = process.env.AIDBOX_CLIENT_SECRET || 'emr-secret-123'

function authHeaders() {
    const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
    return {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/fhir+json',
    }
}

interface GenerateSOAPRequest {
    patientId: string
    encounterId?: string
    transcript?: string
    extraction?: ClinicalExtraction
    patientContext?: PatientContext
    saveToFHIR?: boolean
}

export async function POST(request: NextRequest) {
    try {
        const body: GenerateSOAPRequest = await request.json()
        const { patientId, encounterId, transcript, extraction, patientContext, saveToFHIR = true } = body

        if (!patientId) {
            return NextResponse.json(
                { error: 'patientId is required' },
                { status: 400 }
            )
        }

        if (!transcript && !extraction) {
            return NextResponse.json(
                { error: 'Either transcript or extraction is required' },
                { status: 400 }
            )
        }

        // Get configured AI provider
        const provider = getScribeProvider()

        // If only transcript provided, extract clinical info first
        let clinicalExtraction = extraction
        if (!clinicalExtraction && transcript) {
            clinicalExtraction = await provider.extractClinical(transcript, patientContext)
        }

        // Generate SOAP note
        const soapNote = await provider.generateSOAP(clinicalExtraction!, patientContext)

        // Save to FHIR if requested
        let documentReferenceId: string | undefined
        if (saveToFHIR) {
            const docRef = await saveSoapToFHIR(patientId, encounterId, soapNote)
            documentReferenceId = docRef.id
        }

        return NextResponse.json({
            success: true,
            soap: soapNote,
            extraction: clinicalExtraction,
            documentReferenceId,
            provider: provider.name,
        })
    } catch (error) {
        console.error('SOAP generation error:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'SOAP generation failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

/**
 * Save SOAP note as FHIR DocumentReference
 */
async function saveSoapToFHIR(
    patientId: string,
    encounterId: string | undefined,
    soap: { subjective: string; objective: string; assessment: string; plan: string }
) {
    const noteContent = `SUBJECTIVE:
${soap.subjective}

OBJECTIVE:
${soap.objective}

ASSESSMENT:
${soap.assessment}

PLAN:
${soap.plan}`

    const documentReference = {
        resourceType: 'DocumentReference',
        status: 'current',
        docStatus: 'preliminary',
        type: {
            coding: [{
                system: 'http://loinc.org',
                code: '11506-3',
                display: 'Progress Note'
            }],
            text: 'AI Scribe SOAP Note'
        },
        subject: {
            reference: `Patient/${patientId}`
        },
        date: new Date().toISOString(),
        author: [{
            display: 'AI Scribe'
        }],
        content: [{
            attachment: {
                contentType: 'text/plain',
                data: Buffer.from(noteContent).toString('base64')
            }
        }],
        extension: [{
            url: 'https://emr-ai.example.org/ext/ai-scribe-generated',
            valueBoolean: true
        }]
    }

    if (encounterId) {
        (documentReference as any).context = {
            encounter: [{ reference: `Encounter/${encounterId}` }]
        }
    }

    const response = await fetch(`${BASE_URL}/DocumentReference`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(documentReference),
    })

    if (!response.ok) {
        throw new Error(`Failed to save SOAP note: ${response.status}`)
    }

    return response.json()
}
