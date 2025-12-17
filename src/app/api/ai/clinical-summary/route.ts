import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

interface PatientData {
  patientName: string
  conditions: Array<{ name: string; status: string }>
  vitals: Array<{ name: string; value: string; unit: string; status?: string }>
  labs: Array<{ name: string; value: string; unit: string; interpretation: string }>
  medications: Array<{ name: string; dose: string; frequency: string }>
  procedures: Array<{ name: string; date: string; status: string }>
}

export async function POST(request: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const patientData: PatientData = await request.json()

    const systemPrompt = `You are a clinical decision support AI assistant for physicians. Generate a concise, accurate clinical summary based on the provided FHIR patient data. 

IMPORTANT RULES:
1. ONLY reference conditions, labs, vitals, and medications that are ACTUALLY present in the data provided
2. Do NOT invent or assume any diagnoses not explicitly listed
3. Do NOT mention heart failure, diabetes, hypertension, or any other condition unless it appears in the conditions list
4. Be factual and evidence-based
5. Use proper medical terminology
6. Format your response as JSON with the following structure:
{
  "chiefComplaint": "Primary reason for clinical attention based on conditions",
  "clinicalSummary": "2-3 sentence summary of patient's current clinical status",
  "activeProblems": ["List of active problems from the data"],
  "keyFindings": {
    "vitals": "Summary of vital signs with any abnormalities",
    "labs": "Summary of lab results with any abnormalities"
  },
  "medicationSummary": "Brief summary of current medication regimen",
  "clinicalAlerts": ["Any critical values or concerning findings requiring attention"],
  "recommendations": ["Evidence-based clinical recommendations based on the actual data"]
}

Respond with ONLY the JSON object, no additional text.`

    const userPrompt = `Generate a clinical summary for:

**Patient:** ${patientData.patientName}

**Active Conditions (${patientData.conditions.length}):**
${patientData.conditions.length > 0 
  ? patientData.conditions.map(c => `- ${c.name} (${c.status})`).join('\n')
  : '- No active conditions recorded'}

**Recent Vitals:**
${patientData.vitals.length > 0
  ? patientData.vitals.map(v => `- ${v.name}: ${v.value} ${v.unit}${v.status && v.status !== 'normal' ? ` [${v.status.toUpperCase()}]` : ''}`).join('\n')
  : '- No vitals recorded'}

**Recent Labs:**
${patientData.labs.length > 0
  ? patientData.labs.map(l => `- ${l.name}: ${l.value} ${l.unit}${l.interpretation !== 'Normal' ? ` [${l.interpretation}]` : ''}`).join('\n')
  : '- No labs recorded'}

**Active Medications (${patientData.medications.length}):**
${patientData.medications.length > 0
  ? patientData.medications.map(m => `- ${m.name} ${m.dose} ${m.frequency}`).join('\n')
  : '- No active medications'}

**Recent Procedures:**
${patientData.procedures.length > 0
  ? patientData.procedures.slice(0, 5).map(p => `- ${p.name} (${p.date}) - ${p.status}`).join('\n')
  : '- No recent procedures'}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', errorText)
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      )
    }

    // Parse the JSON response
    try {
      const summary = JSON.parse(content)
      return NextResponse.json(summary)
    } catch {
      // If parsing fails, return the raw content
      return NextResponse.json({
        chiefComplaint: 'Clinical assessment',
        clinicalSummary: content,
        activeProblems: patientData.conditions.map(c => c.name),
        keyFindings: { vitals: '', labs: '' },
        medicationSummary: '',
        clinicalAlerts: [],
        recommendations: [],
      })
    }
  } catch (error) {
    console.error('Clinical summary error:', error)
    return NextResponse.json(
      { error: 'Failed to generate clinical summary' },
      { status: 500 }
    )
  }
}
