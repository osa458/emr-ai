/**
 * AI Scribe Transcription API
 * POST /api/ai/scribe/transcribe
 * 
 * Transcribes audio to text using configured AI provider
 */

import { NextRequest, NextResponse } from 'next/server'
import { getScribeProvider } from '@/lib/ai-scribe'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const audio = formData.get('audio') as Blob
        const language = formData.get('language') as string | null
        const speakerDiarization = formData.get('speakerDiarization') === 'true'
        const vocabularyHint = formData.get('vocabularyHint') as string | null

        if (!audio) {
            return NextResponse.json(
                { error: 'Audio file is required' },
                { status: 400 }
            )
        }

        // Get configured AI provider
        const provider = getScribeProvider()

        // Transcribe audio
        const transcript = await provider.transcribe(audio, {
            language: language || 'en',
            speakerDiarization,
            vocabularyHint: vocabularyHint ? vocabularyHint.split(',') : undefined,
        })

        return NextResponse.json({
            success: true,
            transcript,
            provider: provider.name,
        })
    } catch (error) {
        console.error('Transcription error:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Transcription failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
