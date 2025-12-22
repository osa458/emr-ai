/**
 * AI Scribe Clinical Extraction API
 * POST /api/ai/scribe/extract
 * 
 * Extracts structured clinical information from transcript
 */

import { NextRequest, NextResponse } from 'next/server'
import { getScribeProvider, type PatientContext } from '@/lib/ai-scribe'

interface ExtractRequest {
    transcript: string
    patientContext?: PatientContext
}

export async function POST(request: NextRequest) {
    try {
        const body: ExtractRequest = await request.json()
        const { transcript, patientContext } = body

        if (!transcript) {
            return NextResponse.json(
                { error: 'Transcript is required' },
                { status: 400 }
            )
        }

        // Get configured AI provider
        const provider = getScribeProvider()

        // Extract clinical information
        const extraction = await provider.extractClinical(transcript, patientContext)

        return NextResponse.json({
            success: true,
            extraction,
            provider: provider.name,
        })
    } catch (error) {
        console.error('Clinical extraction error:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Clinical extraction failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
