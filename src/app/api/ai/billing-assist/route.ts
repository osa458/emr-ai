/**
 * Billing Assist API - Generate E&M billing codes from note content and FHIR data
 * Uses AI to analyze note complexity and suggest appropriate billing codes
 */

import { NextRequest, NextResponse } from 'next/server'
import { llmRequest } from '@/lib/llm/client'

const BILLING_SYSTEM_PROMPT = `You are a clinical documentation and billing optimization assistant. Your role is to analyze clinical notes and suggest appropriate E&M (Evaluation and Management) billing codes based on the complexity and content of the note.

CRITICAL RULES:
1. ONLY suggest codes that are clearly supported by the documentation provided
2. Always prioritize compliance over revenue optimization
3. Base your recommendation on the actual note content, not assumptions
4. Consider the number of problems addressed, complexity of decision-making, and data reviewed

E&M CODE SELECTION CRITERIA (Subsequent Hospital Visit):
- 99231 (Low): 1-2 problems, straightforward decision-making, minimal data review
- 99232 (Moderate): 3-4 problems, moderate complexity, moderate data review
- 99233 (High): 5+ problems, high complexity, extensive data review, or unstable patient

OUTPUT FORMAT:
Return a JSON object with:
{
  "suggestedCode": "99231" | "99232" | "99233",
  "rationale": "Brief explanation of why this code level is appropriate",
  "supportingFactors": ["Factor 1", "Factor 2", ...],
  "documentationGaps": ["Any gaps that could support a higher level if documented"]
}`

function buildBillingUserPrompt(data: {
  noteContent: string
  conditions: Array<{ name: string; status: string }>
  vitals: Array<{ name: string; value: string; unit: string }>
  labs: Array<{ name: string; value: string; unit: string; interpretation: string }>
  medications: number
  problems: number
}): string {
  return `Analyze this clinical note and suggest an appropriate E&M billing code:

NOTE CONTENT:
${data.noteContent.substring(0, 3000)}${data.noteContent.length > 3000 ? '...' : ''}

PATIENT CONTEXT:
- Active Conditions: ${data.conditions.length} (${data.conditions.map(c => c.name).join(', ')})
- Problems Addressed in Note: ${data.problems}
- Medications: ${data.medications} active medications
- Vitals Reviewed: ${data.vitals.length}
- Labs Reviewed: ${data.labs.length} (${data.labs.filter(l => l.interpretation && l.interpretation !== 'Normal').length} abnormal)

Based on the note content and clinical complexity, suggest the most appropriate subsequent hospital visit E&M code (99231, 99232, or 99233) with supporting rationale.`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteContent, conditions, vitals, labs, medications, problems } = body

    if (!noteContent) {
      return NextResponse.json(
        { success: false, error: 'Note content is required' },
        { status: 400 }
      )
    }

    const userPrompt = buildBillingUserPrompt({
      noteContent,
      conditions: conditions || [],
      vitals: vitals || [],
      labs: labs || [],
      medications: medications || 0,
      problems: problems || 0,
    })

    // Use LLM to analyze and suggest billing code
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: BILLING_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', errorText)
      // Fallback to rule-based selection
      const suggestedCode = problems >= 5 ? '99233' : problems >= 3 ? '99232' : '99231'
      return NextResponse.json({
        success: true,
        suggestedCode,
        rationale: `Rule-based selection: ${problems} problems addressed`,
        supportingFactors: [`${problems} problems in assessment/plan`],
        documentationGaps: [],
      })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No response from AI')
    }

    const parsed = JSON.parse(content)

    // Validate the code is one of the allowed values
    const validCodes = ['99231', '99232', '99233']
    if (!validCodes.includes(parsed.suggestedCode)) {
      // Fallback to rule-based
      const suggestedCode = problems >= 5 ? '99233' : problems >= 3 ? '99232' : '99231'
      parsed.suggestedCode = suggestedCode
      parsed.rationale = parsed.rationale || 'Rule-based fallback'
    }

    return NextResponse.json({
      success: true,
      ...parsed,
    })
  } catch (error: any) {
    console.error('Billing assist error:', error)
    // Fallback to rule-based selection
    const body = await request.json().catch(() => ({}))
    const problems = body.problems || 0
    const suggestedCode = problems >= 5 ? '99233' : problems >= 3 ? '99232' : '99231'
    
    return NextResponse.json({
      success: true,
      suggestedCode,
      rationale: `Rule-based fallback: ${problems} problems addressed`,
      supportingFactors: [`${problems} problems in assessment/plan`],
      documentationGaps: [],
    })
  }
}


