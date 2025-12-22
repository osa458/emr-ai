/**
 * OpenAI Provider Implementation
 * 
 * Uses OpenAI Whisper for transcription and GPT-4 for clinical extraction
 */

import OpenAI from 'openai'
import type {
    AIProvider,
    Transcript,
    TranscribeOptions,
    ClinicalExtraction,
    SOAPNote,
    PatientContext,
} from './ai-provider'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const CLINICAL_EXTRACTION_PROMPT = `You are a medical scribe AI. Extract structured clinical information from the following patient encounter transcript.

Return a JSON object with these fields (include only what's mentioned):
- chiefComplaint: Main reason for visit
- historyOfPresentIllness: Detailed HPI narrative
- reviewOfSystems: Object with system names as keys
- physicalExam: Object with exam components as keys
- assessment: Array of diagnoses/impressions
- plan: Array of {problem, assessment, interventions[]}
- medications: Array of {name, dose?, route?, frequency?, action?}
- allergies: Array of allergy names
- procedures: Array of procedures mentioned
- orders: Array of {type, name, urgency?, reason?}
- followUp: Follow-up instructions

Be thorough but only include information explicitly stated or clearly implied.`

const SOAP_GENERATION_PROMPT = `You are a medical documentation specialist. Generate a professional SOAP note from the clinical extraction.

Format the note with clear sections:

SUBJECTIVE:
- Chief Complaint
- History of Present Illness
- Review of Systems
- Past Medical/Surgical History
- Medications
- Allergies
- Social/Family History

OBJECTIVE:
- Vital Signs
- Physical Examination
- Lab Results
- Imaging

ASSESSMENT:
- Problem list with clinical reasoning

PLAN:
- Numbered list by problem with specific interventions

Use professional medical terminology. Be concise but thorough.`

export class OpenAIProvider implements AIProvider {
    name: 'openai' = 'openai'

    async transcribe(audio: Blob | Buffer, options?: TranscribeOptions): Promise<Transcript> {
        try {
            // Convert to File for OpenAI API
            let file: File
            if (audio instanceof Blob) {
                file = new File([audio], 'audio.webm', { type: 'audio/webm' })
            } else {
                // Buffer need conversion to work with File - use Uint8Array
                const uint8 = new Uint8Array(audio)
                file = new File([uint8], 'audio.webm', { type: 'audio/webm' })
            }

            const response = await openai.audio.transcriptions.create({
                file,
                model: 'whisper-1',
                language: options?.language || 'en',
                response_format: 'verbose_json',
                prompt: options?.vocabularyHint?.join(', '),
            })

            // Map response to our Transcript interface
            return {
                text: response.text,
                language: response.language,
                duration: response.duration,
                segments: response.segments?.map((seg, i) => ({
                    id: i,
                    start: seg.start,
                    end: seg.end,
                    text: seg.text,
                })),
            }
        } catch (error) {
            console.error('OpenAI transcription error:', error)
            throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    async extractClinical(transcript: string, context?: PatientContext): Promise<ClinicalExtraction> {
        try {
            const systemPrompt = CLINICAL_EXTRACTION_PROMPT + (context ? `

Patient Context:
- Name: ${context.patientName || 'Unknown'}
- Age: ${context.age || 'Unknown'}
- Gender: ${context.gender || 'Unknown'}
- Known Conditions: ${context.conditions?.join(', ') || 'None provided'}
- Current Medications: ${context.medications?.join(', ') || 'None provided'}
- Known Allergies: ${context.allergies?.join(', ') || 'None provided'}` : '')

            const response = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Transcript:\n\n${transcript}` }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.3,
            })

            const content = response.choices[0]?.message?.content
            if (!content) {
                throw new Error('No content in response')
            }

            return JSON.parse(content) as ClinicalExtraction
        } catch (error) {
            console.error('OpenAI extraction error:', error)
            throw new Error(`Clinical extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    async generateSOAP(extraction: ClinicalExtraction, context?: PatientContext): Promise<SOAPNote> {
        try {
            const systemPrompt = SOAP_GENERATION_PROMPT + (context ? `

Patient: ${context.patientName || 'Unknown'}, ${context.age || '?'}yo ${context.gender || ''}
Encounter Type: ${context.encounterType || 'Unknown'}` : '')

            const response = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Clinical Extraction:\n\n${JSON.stringify(extraction, null, 2)}` }
                ],
                temperature: 0.4,
            })

            const content = response.choices[0]?.message?.content
            if (!content) {
                throw new Error('No content in response')
            }

            // Parse the structured response
            const sections = parseSOAPSections(content)

            return {
                subjective: sections.subjective || '',
                objective: sections.objective || '',
                assessment: sections.assessment || '',
                plan: sections.plan || '',
                sections: {
                    chiefComplaint: extraction.chiefComplaint,
                    hpi: extraction.historyOfPresentIllness,
                    problemList: extraction.assessment,
                }
            }
        } catch (error) {
            console.error('OpenAI SOAP generation error:', error)
            throw new Error(`SOAP generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    async *generateSOAPStream(extraction: ClinicalExtraction, context?: PatientContext): AsyncIterable<string> {
        const systemPrompt = SOAP_GENERATION_PROMPT + (context ? `

Patient: ${context.patientName || 'Unknown'}, ${context.age || '?'}yo ${context.gender || ''}
Encounter Type: ${context.encounterType || 'Unknown'}` : '')

        const stream = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Clinical Extraction:\n\n${JSON.stringify(extraction, null, 2)}` }
            ],
            temperature: 0.4,
            stream: true,
        })

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
                yield content
            }
        }
    }
}

/**
 * Parse SOAP sections from free-text response
 */
function parseSOAPSections(text: string): { subjective?: string; objective?: string; assessment?: string; plan?: string } {
    const sections: { subjective?: string; objective?: string; assessment?: string; plan?: string } = {}

    // Match section headers
    const subjectiveMatch = text.match(/SUBJECTIVE:?\s*([\s\S]*?)(?=OBJECTIVE:|$)/i)
    const objectiveMatch = text.match(/OBJECTIVE:?\s*([\s\S]*?)(?=ASSESSMENT:|$)/i)
    const assessmentMatch = text.match(/ASSESSMENT:?\s*([\s\S]*?)(?=PLAN:|$)/i)
    const planMatch = text.match(/PLAN:?\s*([\s\S]*?)$/i)

    if (subjectiveMatch) sections.subjective = subjectiveMatch[1].trim()
    if (objectiveMatch) sections.objective = objectiveMatch[1].trim()
    if (assessmentMatch) sections.assessment = assessmentMatch[1].trim()
    if (planMatch) sections.plan = planMatch[1].trim()

    return sections
}

// Export singleton instance
export const openAIProvider = new OpenAIProvider()
