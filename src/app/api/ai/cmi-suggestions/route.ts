/**
 * CMI Diagnosis Suggestions API
 * 
 * Uses AI to analyze patient's FHIR data and suggest ICD-10 codes
 * that may improve Case Mix Index (CMI) based on clinical evidence.
 */

import { NextRequest, NextResponse } from 'next/server'

const FHIR_BASE = process.env.NEXT_PUBLIC_AIDBOX_BASE_URL || 'https://aoadhslfxc.edge.aidbox.app'
const FHIR_AUTH = Buffer.from(
    `${process.env.AIDBOX_CLIENT_ID || 'emr-ai'}:${process.env.AIDBOX_CLIENT_SECRET || 'secret'}`
).toString('base64')

// HCC-relevant diagnosis categories
interface DiagnosisSuggestion {
    code: string
    description: string
    category: 'mcc' | 'cc' | 'hcc' | 'secondary'
    confidence: 'high' | 'moderate' | 'low'
    evidence: string[]
    suggestedFromCondition?: string
}

const CMI_SYSTEM_PROMPT = `You are a clinical documentation improvement (CDI) specialist. Your role is to analyze patient data and suggest ICD-10-CM diagnosis codes that may improve documentation specificity and Case Mix Index (CMI).

CRITICAL RULES:
1. ONLY suggest diagnoses that are CLEARLY supported by the clinical data provided
2. Never suggest diagnoses that aren't evidenced in the data
3. Focus on specificity - suggest more specific codes when evidence supports them
4. Prioritize MCC (Major Complication/Comorbidity) and CC (Complication/Comorbidity) codes

COMMON CDI OPPORTUNITIES:
- Diabetes: If on insulin + has nephropathy/neuropathy/retinopathy, suggest specific diabetes manifestation codes
- Heart Failure: If EF documented, suggest systolic vs diastolic specificity
- CKD: If GFR documented, suggest appropriate stage
- Malnutrition: If albumin low or weight loss documented, suggest malnutrition
- Acute conditions: If present on admission, ensure acute vs chronic is documented

OUTPUT FORMAT (JSON):
{
  "suggestions": [
    {
      "code": "ICD-10 code",
      "description": "Description",
      "category": "mcc" | "cc" | "hcc" | "secondary",
      "confidence": "high" | "moderate" | "low",
      "evidence": ["Evidence 1", "Evidence 2"],
      "suggestedFromCondition": "Original condition being refined"
    }
  ],
  "documentationTips": ["Tip 1", "Tip 2"]
}`

async function fetchFHIR(path: string) {
    const response = await fetch(`${FHIR_BASE}${path}`, {
        headers: {
            'Content-Type': 'application/fhir+json',
            'Authorization': `Basic ${FHIR_AUTH}`
        }
    })
    if (!response.ok) {
        console.error(`FHIR fetch failed: ${path}`, response.status)
        return { entry: [] }
    }
    return response.json()
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const patientId = searchParams.get('patientId')

        if (!patientId) {
            return NextResponse.json(
                { success: false, error: 'patientId is required' },
                { status: 400 }
            )
        }

        // Fetch patient's clinical data
        const [conditionsBundle, labsBundle, medsBundle, vitalsBundle] = await Promise.all([
            fetchFHIR(`/Condition?patient=${patientId}&clinical-status=active`),
            fetchFHIR(`/Observation?patient=${patientId}&category=laboratory&_sort=-date&_count=50`),
            fetchFHIR(`/MedicationRequest?patient=${patientId}&status=active`),
            fetchFHIR(`/Observation?patient=${patientId}&category=vital-signs&_sort=-date&_count=20`)
        ])

        const conditions = (conditionsBundle.entry || []).map((e: any) => e.resource)
        const labs = (labsBundle.entry || []).map((e: any) => e.resource)
        const meds = (medsBundle.entry || []).map((e: any) => e.resource)
        const vitals = (vitalsBundle.entry || []).map((e: any) => e.resource)

        // Format data for AI analysis
        const conditionNames = conditions.map((c: any) => ({
            name: c.code?.text || c.code?.coding?.[0]?.display || 'Unknown',
            code: c.code?.coding?.[0]?.code || '',
            system: c.code?.coding?.[0]?.system || ''
        }))

        const abnormalLabs = labs.filter((l: any) => {
            const interp = l.interpretation?.[0]?.coding?.[0]?.code
            return interp && ['H', 'HH', 'L', 'LL', 'A'].includes(interp)
        }).map((l: any) => ({
            name: l.code?.text || l.code?.coding?.[0]?.display || 'Unknown',
            value: l.valueQuantity?.value,
            unit: l.valueQuantity?.unit || '',
            interpretation: l.interpretation?.[0]?.coding?.[0]?.code
        }))

        const medNames = meds.map((m: any) =>
            m.medicationCodeableConcept?.text || m.medicationCodeableConcept?.coding?.[0]?.display || 'Unknown'
        )

        // Build prompt for AI
        const userPrompt = `Analyze this patient's data and suggest ICD-10 codes that may improve documentation specificity and CMI:

CURRENT CONDITIONS:
${conditionNames.map((c: any) => `- ${c.name} (${c.code || 'no code'})`).join('\n') || 'None documented'}

ABNORMAL LABS:
${abnormalLabs.map((l: any) => `- ${l.name}: ${l.value} ${l.unit} (${l.interpretation})`).join('\n') || 'None'}

MEDICATIONS:
${medNames.slice(0, 20).join(', ') || 'None'}

Based on this data, suggest ICD-10 codes that:
1. Add specificity to existing conditions (e.g., stage, type, manifestation)
2. Capture underdocumented comorbidities
3. Prioritize MCC/CC codes that are clinically evidenced`

        // Call OpenAI for analysis
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: CMI_SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.3,
                max_tokens: 1000,
                response_format: { type: 'json_object' },
            }),
        })

        if (!response.ok) {
            console.error('OpenAI API error:', await response.text())
            // Fallback to rule-based suggestions
            return NextResponse.json({
                success: true,
                suggestions: generateRuleBasedSuggestions(conditionNames, abnormalLabs, medNames),
                documentationTips: ['Consider documenting specific severity and manifestations of chronic conditions'],
                isAIGenerated: false
            })
        }

        const data = await response.json()
        const content = data.choices?.[0]?.message?.content

        if (!content) {
            throw new Error('No response from AI')
        }

        const parsed = JSON.parse(content)

        return NextResponse.json({
            success: true,
            suggestions: parsed.suggestions || [],
            documentationTips: parsed.documentationTips || [],
            isAIGenerated: true
        })

    } catch (error: any) {
        console.error('CMI suggestions error:', error)
        return NextResponse.json({
            success: false,
            error: error.message,
            suggestions: [],
            documentationTips: []
        })
    }
}

// Rule-based fallback when AI is unavailable
function generateRuleBasedSuggestions(
    conditions: Array<{ name: string; code: string }>,
    abnormalLabs: Array<{ name: string; value: number; interpretation: string }>,
    medications: string[]
): DiagnosisSuggestion[] {
    const suggestions: DiagnosisSuggestion[] = []

    // Check for diabetes + insulin = suggest specific type
    const hasDiabetes = conditions.some(c =>
        c.name.toLowerCase().includes('diabetes') || c.code?.startsWith('E11') || c.code?.startsWith('E10')
    )
    const hasInsulin = medications.some(m =>
        m.toLowerCase().includes('insulin') || m.toLowerCase().includes('lantus') || m.toLowerCase().includes('humalog')
    )
    if (hasDiabetes && hasInsulin) {
        suggestions.push({
            code: 'E11.65',
            description: 'Type 2 DM with hyperglycemia',
            category: 'cc',
            confidence: 'moderate',
            evidence: ['Patient on insulin therapy', 'Diabetes documented'],
            suggestedFromCondition: 'Diabetes mellitus'
        })
    }

    // Check for CKD indicators
    const creatinine = abnormalLabs.find(l =>
        l.name.toLowerCase().includes('creatinine') || l.name.toLowerCase().includes('cr')
    )
    if (creatinine && creatinine.value > 1.5) {
        suggestions.push({
            code: 'N18.3',
            description: 'CKD Stage 3',
            category: 'cc',
            confidence: 'moderate',
            evidence: [`Creatinine ${creatinine.value} (elevated)`],
            suggestedFromCondition: 'Renal function abnormality'
        })
    }

    // Check for heart failure
    const hasHF = conditions.some(c =>
        c.name.toLowerCase().includes('heart failure') || c.code?.startsWith('I50')
    )
    const hasLoopDiuretic = medications.some(m =>
        m.toLowerCase().includes('furosemide') || m.toLowerCase().includes('lasix') || m.toLowerCase().includes('bumetanide')
    )
    if (hasHF || hasLoopDiuretic) {
        suggestions.push({
            code: 'I50.22',
            description: 'Chronic systolic (HFrEF) heart failure',
            category: 'cc',
            confidence: hasHF ? 'high' : 'moderate',
            evidence: hasHF
                ? ['Heart failure documented']
                : ['Patient on loop diuretic therapy'],
            suggestedFromCondition: 'Heart failure'
        })
    }

    // Check for AKI
    if (creatinine && creatinine.value > 2.0) {
        suggestions.push({
            code: 'N17.9',
            description: 'Acute kidney injury',
            category: 'cc',
            confidence: 'moderate',
            evidence: [`Creatinine significantly elevated: ${creatinine.value}`],
        })
    }

    return suggestions
}
