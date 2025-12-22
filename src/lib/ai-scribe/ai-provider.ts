/**
 * AI Provider Interface for AI Scribe
 * 
 * Defines the contract for AI providers (OpenAI, BastionGPT, etc.)
 * Enables easy swapping between providers without code changes.
 */

export interface Transcript {
    text: string
    segments?: TranscriptSegment[]
    language?: string
    duration?: number
    confidence?: number
}

export interface TranscriptSegment {
    id: number
    start: number // seconds
    end: number
    text: string
    speaker?: string
    confidence?: number
}

export interface ClinicalExtraction {
    chiefComplaint?: string
    historyOfPresentIllness?: string
    reviewOfSystems?: ReviewOfSystems
    physicalExam?: PhysicalExam
    assessment?: string[]
    plan?: PlanItem[]
    medications?: MedicationMention[]
    allergies?: string[]
    procedures?: string[]
    orders?: OrderMention[]
    followUp?: string
}

export interface ReviewOfSystems {
    constitutional?: string
    cardiovascular?: string
    respiratory?: string
    gastrointestinal?: string
    genitourinary?: string
    musculoskeletal?: string
    neurological?: string
    psychiatric?: string
    skin?: string
    [key: string]: string | undefined
}

export interface PhysicalExam {
    general?: string
    vitals?: string
    heent?: string
    neck?: string
    cardiovascular?: string
    lungs?: string
    abdomen?: string
    extremities?: string
    neurological?: string
    skin?: string
    [key: string]: string | undefined
}

export interface PlanItem {
    problem: string
    assessment: string
    interventions: string[]
}

export interface MedicationMention {
    name: string
    dose?: string
    route?: string
    frequency?: string
    action?: 'continue' | 'start' | 'stop' | 'change'
}

export interface OrderMention {
    type: 'lab' | 'imaging' | 'procedure' | 'medication' | 'referral'
    name: string
    urgency?: 'routine' | 'urgent' | 'stat'
    reason?: string
}

export interface SOAPNote {
    subjective: string
    objective: string
    assessment: string
    plan: string
    sections?: {
        chiefComplaint?: string
        hpi?: string
        ros?: string
        pmh?: string
        medications?: string
        allergies?: string
        socialHistory?: string
        familyHistory?: string
        physicalExam?: string
        labs?: string
        imaging?: string
        problemList?: string[]
    }
}

/**
 * AI Provider Interface
 * 
 * Implement this interface for each AI provider (OpenAI, BastionGPT, etc.)
 */
export interface AIProvider {
    name: 'openai' | 'bastiongpt' | 'anthropic' | 'local'

    /**
     * Transcribe audio to text
     */
    transcribe(audio: Blob | Buffer, options?: TranscribeOptions): Promise<Transcript>

    /**
     * Extract structured clinical information from transcript
     */
    extractClinical(transcript: string, context?: PatientContext): Promise<ClinicalExtraction>

    /**
     * Generate SOAP note from clinical extraction
     */
    generateSOAP(extraction: ClinicalExtraction, context?: PatientContext): Promise<SOAPNote>

    /**
     * Optional: Stream SOAP note generation for real-time display
     */
    generateSOAPStream?(extraction: ClinicalExtraction, context?: PatientContext): AsyncIterable<string>
}

export interface TranscribeOptions {
    language?: string
    speakerDiarization?: boolean
    vocabularyHint?: string[] // Medical terms to recognize
}

export interface PatientContext {
    patientId?: string
    patientName?: string
    age?: number
    gender?: string
    conditions?: string[]
    medications?: string[]
    allergies?: string[]
    vitals?: Record<string, string>
    labs?: Record<string, string>
    encounterType?: 'inpatient' | 'outpatient' | 'emergency' | 'telehealth'
}

/**
 * Provider registry for runtime selection
 */
const providers: Map<string, AIProvider> = new Map()

export function registerProvider(provider: AIProvider): void {
    providers.set(provider.name, provider)
}

export function getProvider(name: string): AIProvider {
    const provider = providers.get(name)
    if (!provider) {
        throw new Error(`AI provider '${name}' not registered. Available: ${Array.from(providers.keys()).join(', ')}`)
    }
    return provider
}

export function getDefaultProvider(): AIProvider {
    const defaultName = process.env.AI_SCRIBE_PROVIDER || 'openai'
    return getProvider(defaultName)
}

export function listProviders(): string[] {
    return Array.from(providers.keys())
}
