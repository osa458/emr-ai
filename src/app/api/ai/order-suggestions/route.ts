import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

/**
 * AI-Powered Order Suggestions API
 * 
 * Analyzes patient clinical data and suggests relevant orders based on:
 * - Current diagnoses/conditions
 * - Recent lab values and trends
 * - Vital signs
 * - Current medications
 */

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

// Helper to fetch from FHIR
async function fetchFHIR(path: string): Promise<any> {
    const baseUrl = process.env.AIDBOX_BASE_URL || process.env.NEXT_PUBLIC_AIDBOX_BASE_URL
    const clientId = process.env.AIDBOX_CLIENT_ID || 'basic'
    const clientSecret = process.env.AIDBOX_CLIENT_SECRET || 'secret'
    const auth = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const res = await fetch(`${baseUrl}/fhir/${path}`, {
        headers: {
            'Authorization': auth,
            'Accept': 'application/fhir+json',
        },
    })

    if (!res.ok) return null
    return res.json()
}

export interface OrderSuggestion {
    id: string
    name: string
    category: 'Labs' | 'Imaging' | 'Medications' | 'Consults' | 'Procedures'
    priority: 'routine' | 'urgent' | 'stat'
    reason: string
    evidence: string[]
    aiConfidence: number
}

export async function POST(request: NextRequest) {
    try {
        const { patientId } = await request.json()

        if (!patientId) {
            return NextResponse.json(
                { error: 'patientId is required' },
                { status: 400 }
            )
        }

        // Fetch patient clinical data in parallel
        const [conditionsBundle, labsBundle, vitalsBundle, medsBundle] = await Promise.all([
            fetchFHIR(`Condition?patient=${patientId}&clinical-status=active&_count=20`),
            fetchFHIR(`Observation?patient=${patientId}&category=laboratory&_sort=-date&_count=30`),
            fetchFHIR(`Observation?patient=${patientId}&category=vital-signs&_sort=-date&_count=20`),
            fetchFHIR(`MedicationRequest?patient=${patientId}&status=active&_count=20`),
        ])

        // Parse FHIR data
        const conditions = conditionsBundle?.entry?.map((e: any) => {
            const c = e.resource
            return c.code?.text || c.code?.coding?.[0]?.display || 'Unknown condition'
        }) || []

        const labs = labsBundle?.entry?.map((e: any) => {
            const o = e.resource
            const name = o.code?.text || o.code?.coding?.[0]?.display || 'Unknown'
            const value = o.valueQuantity?.value
            const unit = o.valueQuantity?.unit || ''
            const interpretation = o.interpretation?.[0]?.coding?.[0]?.code
            return `${name}: ${value}${unit}${interpretation === 'H' ? ' (High)' : interpretation === 'L' ? ' (Low)' : ''}`
        }) || []

        const vitals = vitalsBundle?.entry?.slice(0, 6).map((e: any) => {
            const o = e.resource
            const name = o.code?.text || o.code?.coding?.[0]?.display || 'Unknown'
            const value = o.valueQuantity?.value
            const unit = o.valueQuantity?.unit || ''
            return `${name}: ${value}${unit}`
        }) || []

        const medications = medsBundle?.entry?.map((e: any) => {
            const m = e.resource
            return m.medicationCodeableConcept?.text || m.medicationCodeableConcept?.coding?.[0]?.display || 'Unknown'
        }) || []

        // Build the prompt
        const prompt = `You are a clinical decision support system for an inpatient EMR. Analyze the following patient data and suggest appropriate orders.

PATIENT DATA:
Active Conditions: ${conditions.length > 0 ? conditions.join(', ') : 'None documented'}
Current Medications: ${medications.length > 0 ? medications.join(', ') : 'None'}
Recent Labs: ${labs.length > 0 ? labs.slice(0, 10).join(', ') : 'None available'}
Recent Vitals: ${vitals.length > 0 ? vitals.join(', ') : 'None available'}

Based on this clinical data, suggest up to 5 appropriate orders that may be clinically indicated. Consider:
- Monitoring needs based on conditions
- Follow-up labs for abnormal values
- Imaging that might be helpful
- Consultations that could benefit the patient
- Preventive measures

Return a JSON array of suggestions with this format:
[
  {
    "name": "Order name",
    "category": "Labs|Imaging|Medications|Consults|Procedures",
    "priority": "routine|urgent|stat",
    "reason": "Brief clinical rationale (1 sentence)",
    "evidence": ["List of specific patient data points supporting this"],
    "confidence": 0.0-1.0
  }
]

Only suggest orders that are clearly relevant to this patient's clinical picture. Be conservative and evidence-based.`

        // Call OpenAI
        let suggestions: OrderSuggestion[] = []

        if (process.env.OPENAI_API_KEY) {
            try {
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: 'You are a clinical decision support system. Always respond with valid JSON only.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 1500,
                })

                const content = completion.choices[0]?.message?.content
                if (content) {
                    // Parse JSON from response
                    const jsonMatch = content.match(/\[[\s\S]*\]/)
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0])
                        suggestions = parsed.map((s: any, idx: number) => ({
                            id: `ai-suggestion-${idx}`,
                            name: s.name,
                            category: s.category,
                            priority: s.priority || 'routine',
                            reason: s.reason,
                            evidence: s.evidence || [],
                            aiConfidence: s.confidence || 0.7,
                        }))
                    }
                }
            } catch (aiError) {
                console.error('[AI Order Suggestions] OpenAI error:', aiError)
            }
        }

        // Fallback suggestions based on conditions if AI fails
        if (suggestions.length === 0) {
            suggestions = generateFallbackSuggestions(conditions, labs)
        }

        return NextResponse.json({
            suggestions,
            patientId,
            dataUsed: {
                conditions: conditions.length,
                labs: labs.length,
                vitals: vitals.length,
                medications: medications.length,
            },
        })
    } catch (error) {
        console.error('[AI Order Suggestions] Error:', error)
        return NextResponse.json(
            { error: 'Failed to generate suggestions', suggestions: [] },
            { status: 500 }
        )
    }
}

// Rule-based fallback when AI is unavailable
function generateFallbackSuggestions(conditions: string[], labs: string[]): OrderSuggestion[] {
    const suggestions: OrderSuggestion[] = []

    // Check for diabetes
    if (conditions.some(c => c.toLowerCase().includes('diabetes'))) {
        suggestions.push({
            id: 'fb-1',
            name: 'HbA1c',
            category: 'Labs',
            priority: 'routine',
            reason: 'Monitor glycemic control in diabetic patient',
            evidence: ['Patient has active diabetes'],
            aiConfidence: 0.85,
        })
    }

    // Check for heart failure
    if (conditions.some(c => c.toLowerCase().includes('heart failure') || c.toLowerCase().includes('chf'))) {
        suggestions.push({
            id: 'fb-2',
            name: 'BNP',
            category: 'Labs',
            priority: 'routine',
            reason: 'Monitor heart failure status',
            evidence: ['Patient has heart failure diagnosis'],
            aiConfidence: 0.9,
        })
        suggestions.push({
            id: 'fb-3',
            name: 'Echocardiogram',
            category: 'Imaging',
            priority: 'routine',
            reason: 'Assess cardiac function',
            evidence: ['Heart failure requires periodic echo assessment'],
            aiConfidence: 0.75,
        })
    }

    // Check for abnormal labs
    if (labs.some(l => l.includes('Creatinine') && l.includes('High'))) {
        suggestions.push({
            id: 'fb-4',
            name: 'Nephrology Consult',
            category: 'Consults',
            priority: 'routine',
            reason: 'Elevated creatinine may benefit from nephrology input',
            evidence: ['Creatinine is elevated'],
            aiConfidence: 0.7,
        })
    }

    // Check for hypertension
    if (conditions.some(c => c.toLowerCase().includes('hypertension'))) {
        suggestions.push({
            id: 'fb-5',
            name: 'Basic Metabolic Panel',
            category: 'Labs',
            priority: 'routine',
            reason: 'Monitor electrolytes in hypertensive patient',
            evidence: ['Patient on antihypertensive medications'],
            aiConfidence: 0.8,
        })
    }

    return suggestions.slice(0, 5)
}
