/**
 * A&P Generator API - Two-Stage AI Pipeline
 * 
 * Stage 1: Summarizes all patient data (FHIR + in-progress note) into structured JSON
 * Stage 2: Generates evidence-backed A&P recommendations from the summary
 * 
 * Anti-hallucination design: Stage 1 only organizes data, Stage 2 cites evidence
 */

import { NextRequest, NextResponse } from 'next/server'

// =============================================================================
// Types
// =============================================================================

interface APGeneratorRequest {
    patientId: string
    // Data from FHIR
    conditions: Array<{ name: string; code?: string; status: string }>
    labs: Array<{ name: string; value: string; unit: string; interpretation: string; date?: string }>
    vitals: Array<{ name: string; value: string; unit: string }>
    medications: Array<{ name: string; dose: string; frequency: string }>
    imaging?: Array<{ type: string; date: string; finding: string }>
    // In-progress note content
    inProgressNote?: {
        subjective?: string
        physicalExam?: string
        ros?: string
    }
    patientName?: string
}

interface SupportingEvidence {
    type: 'lab' | 'vital' | 'medication' | 'imaging' | 'hpi' | 'exam'
    finding: string
    value?: string
    interpretation?: string
}

interface Stage1Problem {
    name: string
    icdCode?: string
    status: 'active' | 'resolved' | 'managed'
    supportingEvidence: SupportingEvidence[]
}

interface Stage1Summary {
    problems: Stage1Problem[]
    clinicalContext: {
        chiefComplaint: string
        hpiSummary?: string
        examFindings?: string
        pertinentNegatives?: string[]
        vitalsSummary?: string
    }
    alerts: string[]
    labSummary: string
    medicationSummary: string
}

interface APRecommendation {
    id: string
    problem: string
    assessment: string
    plan: string[]
    evidence: string[]
    confidence: 'high' | 'moderate' | 'low'
}

interface APGeneratorResponse {
    success: boolean
    stage1Summary?: Stage1Summary
    recommendations: APRecommendation[]
    error?: string
}

// =============================================================================
// Stage 1: Summarization (Anti-Hallucination)
// =============================================================================

const STAGE1_SYSTEM_PROMPT = `You are a clinical data organizer. Your ONLY task is to structure and summarize the provided patient data.

CRITICAL RULES - FOLLOW EXACTLY:
1. NEVER infer, assume, or add information not explicitly provided
2. NEVER suggest diagnoses not in the conditions list
3. If data is missing, explicitly state "Not documented"
4. Use EXACT values from labs/vitals - do not interpret, round, or modify
5. Organize the in-progress note content (HPI, Physical Exam) FAITHFULLY - copy key phrases
6. For each problem, list ONLY supporting evidence that is DIRECTLY provided
7. Do NOT add clinical interpretation - just organize the facts

Your output is purely organizational - you are preparing data for clinical analysis.

OUTPUT FORMAT (JSON only):
{
  "problems": [
    {
      "name": "Condition name exactly as provided",
      "icdCode": "Code if provided, else null",
      "status": "active|resolved|managed",
      "supportingEvidence": [
        { "type": "lab|vital|medication|imaging|hpi|exam", "finding": "exact finding", "value": "exact value", "interpretation": "H/L/Normal" }
      ]
    }
  ],
  "clinicalContext": {
    "chiefComplaint": "From HPI or primary condition",
    "hpiSummary": "Key points from subjective note, verbatim quotes preferred",
    "examFindings": "Key physical exam findings from note",
    "pertinentNegatives": ["List any documented negatives"],
    "vitalsSummary": "BP X/Y, HR X, RR X, SpO2 X% on RA"
  },
  "alerts": ["Critical lab values or concerning vitals only"],
  "labSummary": "Brief factual summary of lab findings",
  "medicationSummary": "Current medication list summary"
}`

function buildStage1Prompt(data: APGeneratorRequest): string {
    const sections: string[] = []

    sections.push(`=== PATIENT DATA FOR ORGANIZATION ===`)
    sections.push(`Patient: ${data.patientName || 'Unknown'}`)
    sections.push('')

    // Conditions
    sections.push(`=== ACTIVE CONDITIONS (${data.conditions.length}) ===`)
    if (data.conditions.length > 0) {
        data.conditions.forEach(c => {
            sections.push(`- ${c.name}${c.code ? ` (${c.code})` : ''} [${c.status}]`)
        })
    } else {
        sections.push('- No active conditions documented')
    }
    sections.push('')

    // Labs
    sections.push(`=== LABORATORY VALUES (${data.labs.length}) ===`)
    if (data.labs.length > 0) {
        data.labs.forEach(l => {
            sections.push(`- ${l.name}: ${l.value} ${l.unit}${l.interpretation !== 'Normal' ? ` [${l.interpretation}]` : ''}${l.date ? ` (${l.date})` : ''}`)
        })
    } else {
        sections.push('- No labs documented')
    }
    sections.push('')

    // Vitals
    sections.push(`=== VITAL SIGNS (${data.vitals.length}) ===`)
    if (data.vitals.length > 0) {
        data.vitals.forEach(v => {
            sections.push(`- ${v.name}: ${v.value} ${v.unit}`)
        })
    } else {
        sections.push('- No vitals documented')
    }
    sections.push('')

    // Medications
    sections.push(`=== MEDICATIONS (${data.medications.length}) ===`)
    if (data.medications.length > 0) {
        data.medications.forEach(m => {
            sections.push(`- ${m.name} ${m.dose} ${m.frequency}`)
        })
    } else {
        sections.push('- No active medications')
    }
    sections.push('')

    // Imaging
    if (data.imaging && data.imaging.length > 0) {
        sections.push(`=== IMAGING (${data.imaging.length}) ===`)
        data.imaging.forEach(i => {
            sections.push(`- ${i.type} (${i.date}): ${i.finding}`)
        })
        sections.push('')
    }

    // In-Progress Note Content
    if (data.inProgressNote) {
        sections.push(`=== IN-PROGRESS NOTE CONTENT ===`)

        if (data.inProgressNote.subjective) {
            sections.push(`--- Subjective/HPI ---`)
            sections.push(data.inProgressNote.subjective)
            sections.push('')
        }

        if (data.inProgressNote.ros) {
            sections.push(`--- Review of Systems ---`)
            sections.push(data.inProgressNote.ros)
            sections.push('')
        }

        if (data.inProgressNote.physicalExam) {
            sections.push(`--- Physical Exam ---`)
            sections.push(data.inProgressNote.physicalExam)
            sections.push('')
        }
    }

    sections.push(`=== END OF DATA ===`)
    sections.push(`Organize this data into the structured JSON format. Do NOT add information not present above.`)

    return sections.join('\n')
}

// =============================================================================
// Stage 2: A&P Analysis
// =============================================================================

const STAGE2_SYSTEM_PROMPT = `You are a clinical decision support AI generating Assessment & Plan recommendations for a physician.

CRITICAL RULES - FOLLOW EXACTLY:
1. ONLY recommend actions supported by evidence in the provided summary
2. For EACH recommendation, cite the SPECIFIC finding that supports it (exact values)
3. Do NOT recommend tests/treatments for conditions not listed in problems
4. Use conservative, standard-of-care recommendations
5. Indicate confidence based on evidence strength:
   - HIGH: 3+ supporting evidence items with clear clinical indication
   - MODERATE: 1-2 evidence items or standard monitoring
   - LOW: Limited evidence, consider clinical judgment
6. Include pertinent negatives from physical exam when relevant
7. Keep plans actionable and specific (e.g., "Continue metoprolol 50mg daily" not "continue beta blocker")

OUTPUT FORMAT (JSON only):
{
  "recommendations": [
    {
      "id": "unique-id",
      "problem": "Problem name",
      "assessment": "1-2 sentence clinical interpretation based on evidence",
      "plan": ["Specific action 1", "Specific action 2", "Specific action 3"],
      "evidence": ["Exact citation 1: value", "Exact citation 2: value"],
      "confidence": "high|moderate|low"
    }
  ]
}`

function buildStage2Prompt(summary: Stage1Summary): string {
    return `Generate Assessment & Plan recommendations based on this clinical summary:

${JSON.stringify(summary, null, 2)}

For each problem in the summary, generate specific, evidence-backed recommendations.
Cite exact values from the summary as evidence for each recommendation.`
}

// =============================================================================
// API Handler
// =============================================================================

export async function POST(request: NextRequest) {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY

    try {
        if (!OPENAI_API_KEY) {
            return NextResponse.json({
                success: false,
                recommendations: [],
                error: 'OpenAI API key not configured',
            } as APGeneratorResponse, { status: 500 })
        }

        const data: APGeneratorRequest = await request.json()

        if (!data.patientId) {
            return NextResponse.json({
                success: false,
                recommendations: [],
                error: 'patientId is required',
            } as APGeneratorResponse, { status: 400 })
        }

        // =========================================================================
        // STAGE 1: Summarization
        // =========================================================================
        console.log('[AP Generator] Stage 1: Summarizing patient data...')

        const stage1Response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: STAGE1_SYSTEM_PROMPT },
                    { role: 'user', content: buildStage1Prompt(data) },
                ],
                temperature: 0.1, // Low temperature for factual summarization
                max_tokens: 2000,
                response_format: { type: 'json_object' },
            }),
        })

        if (!stage1Response.ok) {
            const errorText = await stage1Response.text()
            console.error('[AP Generator] Stage 1 error:', errorText)
            return NextResponse.json({
                success: false,
                recommendations: [],
                error: `Stage 1 failed: ${stage1Response.status}`,
            } as APGeneratorResponse, { status: 500 })
        }

        const stage1Data = await stage1Response.json()
        const stage1Content = stage1Data.choices?.[0]?.message?.content

        if (!stage1Content) {
            return NextResponse.json({
                success: false,
                recommendations: [],
                error: 'No response from Stage 1',
            } as APGeneratorResponse, { status: 500 })
        }

        let stage1Summary: Stage1Summary
        try {
            stage1Summary = JSON.parse(stage1Content)
            console.log('[AP Generator] Stage 1 complete:', stage1Summary.problems.length, 'problems identified')
        } catch (e) {
            console.error('[AP Generator] Stage 1 JSON parse error:', e)
            return NextResponse.json({
                success: false,
                recommendations: [],
                error: 'Failed to parse Stage 1 summary',
            } as APGeneratorResponse, { status: 500 })
        }

        // =========================================================================
        // STAGE 2: A&P Analysis
        // =========================================================================
        console.log('[AP Generator] Stage 2: Generating A&P recommendations...')

        const stage2Response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: STAGE2_SYSTEM_PROMPT },
                    { role: 'user', content: buildStage2Prompt(stage1Summary) },
                ],
                temperature: 0.3, // Slightly higher for recommendations
                max_tokens: 2000,
                response_format: { type: 'json_object' },
            }),
        })

        if (!stage2Response.ok) {
            const errorText = await stage2Response.text()
            console.error('[AP Generator] Stage 2 error:', errorText)
            // Return partial success with Stage 1 summary
            return NextResponse.json({
                success: true,
                stage1Summary,
                recommendations: [],
                error: `Stage 2 failed: ${stage2Response.status}`,
            } as APGeneratorResponse)
        }

        const stage2Data = await stage2Response.json()
        const stage2Content = stage2Data.choices?.[0]?.message?.content

        if (!stage2Content) {
            return NextResponse.json({
                success: true,
                stage1Summary,
                recommendations: [],
                error: 'No response from Stage 2',
            } as APGeneratorResponse)
        }

        let recommendations: APRecommendation[] = []
        try {
            const parsed = JSON.parse(stage2Content)
            recommendations = parsed.recommendations || []
            console.log('[AP Generator] Stage 2 complete:', recommendations.length, 'recommendations generated')
        } catch (e) {
            console.error('[AP Generator] Stage 2 JSON parse error:', e)
        }

        return NextResponse.json({
            success: true,
            stage1Summary,
            recommendations,
        } as APGeneratorResponse)

    } catch (error) {
        console.error('[AP Generator] Error:', error)
        return NextResponse.json({
            success: false,
            recommendations: [],
            error: 'Failed to generate A&P recommendations',
        } as APGeneratorResponse, { status: 500 })
    }
}
