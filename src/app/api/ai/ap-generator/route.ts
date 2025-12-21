/**
 * Agentic A&P Generator API - Two-Stage AI Pipeline with Chart Lookup
 * 
 * Stage 1: AI summarizes data and can request additional chart lookups
 * Stage 2: AI generates A&P and can request additional chart lookups
 * 
 * Both stages support function calling for agentic chart exploration
 */

import { NextRequest, NextResponse } from 'next/server'
import {
    executeChartLookup,
    openAIFunctionDefinitions,
    getAllergies,
    getEchoTTE,
    getProcedures,
    getPriorNotes,
    getEncounters,
    getGoalsOfCare,
} from '@/lib/ai/chartLookup'

// =============================================================================
// Types
// =============================================================================

interface APGeneratorRequest {
    patientId: string
    patientName?: string
    // Data from FHIR
    conditions: Array<{ name: string; code?: string; status: string }>
    labs: Array<{ name: string; value: string; unit: string; interpretation: string; date?: string }>
    vitals: Array<{ name: string; value: string; unit: string; date?: string }>
    medications: Array<{ name: string; dose: string; frequency: string }>
    imaging?: Array<{ type: string; date: string; finding: string }>
    // In-progress note content
    inProgressNote?: {
        subjective?: string
        physicalExam?: string
        ros?: string
    }
}

interface Stage1Summary {
    problems: Array<{
        name: string
        icdCode?: string
        status: 'active' | 'resolved' | 'managed'
        supportingEvidence: Array<{
            type: 'lab' | 'vital' | 'medication' | 'imaging' | 'hpi' | 'exam' | 'allergy' | 'procedure' | 'echo'
            finding: string
            value?: string
            interpretation?: string
            date?: string
        }>
    }>
    clinicalContext: {
        chiefComplaint: string
        hpiSummary?: string
        examFindings?: string
        pertinentNegatives?: string[]
        vitalsSummary?: string
        allergies?: string[]
        echoFindings?: string
        surgicalHistory?: string
        recentEncounters?: string
        goalsOfCare?: string
    }
    alerts: string[]
    labSummary: string
    medicationSummary: string
    dataRequested?: string[]
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
    dataFetched?: string[]
}

// =============================================================================
// Comprehensive Initial Data Fetch
// =============================================================================

async function fetchComprehensiveData(patientId: string) {
    console.log('[AP Generator] Fetching comprehensive patient data...')

    // Fetch all additional data sources in parallel
    const [allergies, echo, procedures, encounters, goals] = await Promise.all([
        getAllergies(patientId).catch(e => { console.error('Allergies fetch failed:', e); return [] }),
        getEchoTTE(patientId).catch(e => { console.error('Echo fetch failed:', e); return [] }),
        getProcedures(patientId, { count: 10 }).catch(e => { console.error('Procedures fetch failed:', e); return [] }),
        getEncounters(patientId, { count: 5 }).catch(e => { console.error('Encounters fetch failed:', e); return [] }),
        getGoalsOfCare(patientId).catch(e => { console.error('Goals fetch failed:', e); return [] }),
    ])

    console.log(`[AP Generator] Fetched: ${allergies.length} allergies, ${echo.length} echos, ${procedures.length} procedures, ${encounters.length} encounters, ${goals.length} goals`)

    return { allergies, echo, procedures, encounters, goals }
}

// =============================================================================
// Stage 1: Summarization with Function Calling
// =============================================================================

const STAGE1_SYSTEM_PROMPT = `You are a clinical data organizer preparing a comprehensive patient summary for A&P generation.

CRITICAL RULES:
1. ONLY use data that is EXPLICITLY provided or that you retrieve via function calls
2. NEVER infer, assume, or hallucinate information
3. All data INCLUDES DATES - always note when data was collected
4. Consider recency: Is this lab from today or weeks ago?
5. Note trends: Is creatinine stable or rising?
6. Flag stale data: "Last TTE was 6 months ago"

IF YOU NEED ADDITIONAL DATA:
- Call get_echo_tte if heart failure present but no EF documented
- Call get_allergies if medication recommendations will be made
- Call get_prior_notes if chronic condition needs history
- Call get_procedures for surgical history
- Call get_labs_by_type for specific labs

OUTPUT FORMAT (JSON):
{
  "problems": [
    {
      "name": "Condition from data",
      "icdCode": "If provided",
      "status": "active|resolved|managed",
      "supportingEvidence": [
        { "type": "lab|vital|medication|imaging|hpi|exam|echo|allergy|procedure", "finding": "exact finding", "value": "value", "date": "date" }
      ]
    }
  ],
  "clinicalContext": {
    "chiefComplaint": "From HPI",
    "hpiSummary": "Key points VERBATIM",
    "examFindings": "Key findings",
    "pertinentNegatives": [],
    "vitalsSummary": "BP X/Y on [date], HR X on [date]",
    "allergies": ["List all allergies"],
    "echoFindings": "EF X% on [date]",
    "surgicalHistory": "Key procedures with dates",
    "recentEncounters": "Recent admissions with dates",
    "goalsOfCare": "Code status, preferences"
  },
  "alerts": ["Critical values with dates"],
  "labSummary": "Summary with dates",
  "medicationSummary": "Current meds",
  "dataRequested": ["Functions called to get additional data"]
}`

function buildStage1Prompt(data: APGeneratorRequest, additionalData: any): string {
    const sections: string[] = []
    const today = new Date().toLocaleDateString()

    sections.push(`=== PATIENT DATA (Today is ${today}) ===`)
    sections.push(`Patient: ${data.patientName || 'Unknown'}`)
    sections.push(`Patient ID: ${data.patientId}`)
    sections.push('')

    // Conditions
    sections.push(`=== CONDITIONS (${data.conditions.length}) ===`)
    data.conditions.forEach(c => {
        sections.push(`- ${c.name}${c.code ? ` (${c.code})` : ''} [${c.status}]`)
    })
    sections.push('')

    // Labs with dates
    sections.push(`=== LABS (${data.labs.length}) ===`)
    data.labs.forEach(l => {
        sections.push(`- ${l.name}: ${l.value} ${l.unit}${l.interpretation !== 'Normal' ? ` [${l.interpretation}]` : ''} (${l.date || 'date unknown'})`)
    })
    sections.push('')

    // Vitals with dates
    sections.push(`=== VITALS (${data.vitals.length}) ===`)
    data.vitals.forEach(v => {
        sections.push(`- ${v.name}: ${v.value} ${v.unit}${v.date ? ` (${v.date})` : ''}`)
    })
    sections.push('')

    // Medications
    sections.push(`=== MEDICATIONS (${data.medications.length}) ===`)
    data.medications.forEach(m => {
        sections.push(`- ${m.name} ${m.dose} ${m.frequency}`)
    })
    sections.push('')

    // Imaging
    if (data.imaging && data.imaging.length > 0) {
        sections.push(`=== IMAGING (${data.imaging.length}) ===`)
        data.imaging.forEach(i => {
            sections.push(`- ${i.type} (${i.date}): ${i.finding}`)
        })
        sections.push('')
    }

    // Allergies (from comprehensive fetch)
    if (additionalData.allergies?.length > 0) {
        sections.push(`=== ALLERGIES (${additionalData.allergies.length}) ===`)
        additionalData.allergies.forEach((a: any) => {
            sections.push(`- ${a.allergen}${a.reaction ? `: ${a.reaction}` : ''}${a.severity ? ` (${a.severity})` : ''}`)
        })
        sections.push('')
    }

    // Echo/TTE (from comprehensive fetch)
    if (additionalData.echo?.length > 0) {
        sections.push(`=== ECHOCARDIOGRAM (${additionalData.echo.length}) ===`)
        additionalData.echo.forEach((e: any) => {
            sections.push(`- ${e.date}: ${e.ejectionFraction ? `EF ${e.ejectionFraction}` : ''}${e.conclusion ? ` - ${e.conclusion}` : ''}`)
        })
        sections.push('')
    }

    // Procedures (from comprehensive fetch)
    if (additionalData.procedures?.length > 0) {
        sections.push(`=== PROCEDURES/SURGICAL HISTORY (${additionalData.procedures.length}) ===`)
        additionalData.procedures.forEach((p: any) => {
            sections.push(`- ${p.name} (${p.date})${p.outcome ? `: ${p.outcome}` : ''}`)
        })
        sections.push('')
    }

    // Recent Encounters (from comprehensive fetch)
    if (additionalData.encounters?.length > 0) {
        sections.push(`=== RECENT ENCOUNTERS (${additionalData.encounters.length}) ===`)
        additionalData.encounters.forEach((e: any) => {
            sections.push(`- ${e.type}: ${e.admitDate || 'unknown'} - ${e.dischargeDate || 'ongoing'}${e.reason ? ` (${e.reason})` : ''}`)
        })
        sections.push('')
    }

    // Goals of Care (from comprehensive fetch)
    if (additionalData.goals?.length > 0) {
        sections.push(`=== GOALS OF CARE ===`)
        additionalData.goals.forEach((g: any) => {
            sections.push(`- ${g.description} [${g.status}]`)
        })
        sections.push('')
    }

    // In-Progress Note Content
    if (data.inProgressNote) {
        sections.push(`=== IN-PROGRESS NOTE ===`)
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
    sections.push(`Analyze this data and create a structured summary. If you need additional information, use the available functions.`)

    return sections.join('\n')
}

// =============================================================================
// Stage 2: A&P Analysis with Function Calling
// =============================================================================

const STAGE2_SYSTEM_PROMPT = `You are a clinical decision support AI generating Assessment & Plan recommendations.

CRITICAL RULES:
1. ONLY recommend actions supported by evidence in the provided summary
2. For EACH recommendation, cite SPECIFIC findings WITH DATES
3. Do NOT recommend tests/treatments for conditions not in the problems list
4. Consider TIMING:
   - "Repeat TTE - last done 12/2023"
   - "Continue current dose - stable x 3 days"
   - "Hold contrast - recent AKI on [date]"
5. Check allergies before recommending ANY medication
6. Confidence levels:
   - HIGH: 3+ evidence items, clear indication, recent data
   - MODERATE: 1-2 evidence items or older data
   - LOW: Limited evidence, stale data, clinical judgment needed

IF YOU NEED VERIFICATION:
- Call get_allergies to verify drug safety
- Call get_labs_by_type for specific pre-procedure labs
- Call get_prior_notes to check prior treatment response

OUTPUT FORMAT (JSON):
{
  "recommendations": [
    {
      "id": "unique-id",
      "problem": "Problem name",
      "assessment": "1-2 sentence interpretation with dates cited",
      "plan": ["Specific action with dose/frequency", "Action 2", "Action 3"],
      "evidence": ["Lab X: value on [date]", "Echo EF X% on [date]"],
      "confidence": "high|moderate|low"
    }
  ]
}`

function buildStage2Prompt(summary: Stage1Summary): string {
    return `Generate Assessment & Plan recommendations based on this comprehensive clinical summary:

${JSON.stringify(summary, null, 2)}

IMPORTANT:
- Consider allergies listed before recommending medications
- Cite dates when referencing any data point
- Note if any critical data is stale or missing

For each problem, generate specific, evidence-backed recommendations with dates.`
}

// =============================================================================
// Agentic Conversation Handler
// =============================================================================

async function runAgenticConversation(
    systemPrompt: string,
    userPrompt: string,
    patientId: string,
    maxIterations: number = 3
): Promise<{ content: string; functionsUsed: string[] }> {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    const messages: any[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
    ]
    const functionsUsed: string[] = []

    for (let i = 0; i < maxIterations; i++) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages,
                temperature: 0.2,
                max_tokens: 3000,
                tools: openAIFunctionDefinitions.map(f => ({ type: 'function', function: f })),
                tool_choice: 'auto',
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        const message = data.choices?.[0]?.message

        if (!message) {
            throw new Error('No message in OpenAI response')
        }

        // Check if AI wants to call functions
        if (message.tool_calls && message.tool_calls.length > 0) {
            console.log(`[AP Generator] AI requesting ${message.tool_calls.length} function calls (iteration ${i + 1})`)

            messages.push(message) // Add assistant message with tool calls

            // Execute each function call
            for (const toolCall of message.tool_calls) {
                const functionName = toolCall.function.name
                const args = JSON.parse(toolCall.function.arguments)

                console.log(`[AP Generator] Executing: ${functionName}(${JSON.stringify(args)})`)
                functionsUsed.push(functionName)

                try {
                    // Inject patientId if not provided
                    if (!args.patientId && patientId) {
                        args.patientId = patientId
                    }

                    const result = await executeChartLookup(functionName, args)

                    messages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(result),
                    })

                    console.log(`[AP Generator] ${functionName} returned ${Array.isArray(result) ? result.length : 1} results`)
                } catch (error) {
                    console.error(`[AP Generator] Function ${functionName} failed:`, error)
                    messages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: JSON.stringify({ error: `Failed to execute ${functionName}` }),
                    })
                }
            }

            // Continue loop to get AI's response after function results
            continue
        }

        // AI provided final response (no function calls)
        return {
            content: message.content || '',
            functionsUsed,
        }
    }

    // Max iterations reached - get final response without functions
    const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages,
            temperature: 0.2,
            max_tokens: 3000,
            response_format: { type: 'json_object' },
        }),
    })

    const finalData = await finalResponse.json()
    return {
        content: finalData.choices?.[0]?.message?.content || '',
        functionsUsed,
    }
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
        // COMPREHENSIVE DATA FETCH
        // =========================================================================
        const additionalData = await fetchComprehensiveData(data.patientId)
        const dataFetched = [
            `${additionalData.allergies.length} allergies`,
            `${additionalData.echo.length} echos`,
            `${additionalData.procedures.length} procedures`,
            `${additionalData.encounters.length} encounters`,
            `${additionalData.goals.length} goals`,
        ]

        // =========================================================================
        // STAGE 1: Summarization (Agentic)
        // =========================================================================
        console.log('[AP Generator] Stage 1: Agentic summarization...')

        const stage1Result = await runAgenticConversation(
            STAGE1_SYSTEM_PROMPT,
            buildStage1Prompt(data, additionalData),
            data.patientId,
            3 // Max iterations
        )

        if (stage1Result.functionsUsed.length > 0) {
            console.log(`[AP Generator] Stage 1 used functions: ${stage1Result.functionsUsed.join(', ')}`)
        }

        let stage1Summary: Stage1Summary
        try {
            // Extract JSON from response (might have markdown fences)
            let jsonContent = stage1Result.content
            const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/)
            if (jsonMatch) {
                jsonContent = jsonMatch[1]
            }
            stage1Summary = JSON.parse(jsonContent)
            stage1Summary.dataRequested = stage1Result.functionsUsed
            console.log('[AP Generator] Stage 1 complete:', stage1Summary.problems.length, 'problems identified')
        } catch (e) {
            console.error('[AP Generator] Stage 1 JSON parse error:', e)
            console.error('[AP Generator] Raw content:', stage1Result.content.substring(0, 500))
            return NextResponse.json({
                success: false,
                recommendations: [],
                error: 'Failed to parse Stage 1 summary',
                dataFetched,
            } as APGeneratorResponse, { status: 500 })
        }

        // =========================================================================
        // STAGE 2: A&P Analysis (Agentic)
        // =========================================================================
        console.log('[AP Generator] Stage 2: Agentic A&P generation...')

        const stage2Result = await runAgenticConversation(
            STAGE2_SYSTEM_PROMPT,
            buildStage2Prompt(stage1Summary),
            data.patientId,
            3 // Max iterations
        )

        if (stage2Result.functionsUsed.length > 0) {
            console.log(`[AP Generator] Stage 2 used functions: ${stage2Result.functionsUsed.join(', ')}`)
        }

        let recommendations: APRecommendation[] = []
        try {
            // Extract JSON from response
            let jsonContent = stage2Result.content
            const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/)
            if (jsonMatch) {
                jsonContent = jsonMatch[1]
            }
            const parsed = JSON.parse(jsonContent)
            recommendations = parsed.recommendations || []
            console.log('[AP Generator] Stage 2 complete:', recommendations.length, 'recommendations generated')
        } catch (e) {
            console.error('[AP Generator] Stage 2 JSON parse error:', e)
            console.error('[AP Generator] Raw content:', stage2Result.content.substring(0, 500))
        }

        return NextResponse.json({
            success: true,
            stage1Summary,
            recommendations,
            dataFetched: [
                ...dataFetched,
                ...stage1Result.functionsUsed.map(f => `AI called: ${f}`),
                ...stage2Result.functionsUsed.map(f => `AI called: ${f}`),
            ],
        } as APGeneratorResponse)

    } catch (error) {
        console.error('[AP Generator] Error:', error)
        return NextResponse.json({
            success: false,
            recommendations: [],
            error: error instanceof Error ? error.message : 'Failed to generate A&P recommendations',
        } as APGeneratorResponse, { status: 500 })
    }
}
