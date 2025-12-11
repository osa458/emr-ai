import { NextRequest, NextResponse } from 'next/server'
import { mockLLMRequest } from '@/lib/llm/client'
import type { DiagnosticAssistOutput } from '@/lib/llm/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { selectedText, patientId, encounterId } = body

    if (!selectedText) {
      return NextResponse.json(
        { success: false, error: 'Selected text is required' },
        { status: 400 }
      )
    }

    // For demo, return mock diagnostic suggestions
    // In production, would call LLM with patient context
    const mockResponse = getMockDiagnosticAssist(selectedText)
    const response = await mockLLMRequest<DiagnosticAssistOutput>(mockResponse)

    return NextResponse.json({
      success: true,
      data: response.data,
      usage: response.usage,
      latencyMs: response.latencyMs,
    })
  } catch (error) {
    console.error('Diagnostic assist error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate diagnostic suggestions' },
      { status: 500 }
    )
  }
}

function getMockDiagnosticAssist(selectedText: string): DiagnosticAssistOutput {
  // Generate context-aware mock based on keywords
  const text = selectedText.toLowerCase()

  if (text.includes('chest pain') || text.includes('shortness of breath')) {
    return {
      suggestions: [
        {
          condition: 'Acute Coronary Syndrome',
          icd10Code: 'I21.9',
          confidence: 'moderate',
          rationale:
            'Chest pain with shortness of breath warrants evaluation for ACS, especially in patients with cardiac risk factors.',
          supportingEvidence: [
            {
              type: 'vital',
              description: 'Elevated heart rate and blood pressure noted',
            },
            {
              type: 'note',
              description: 'Patient describes substernal pressure',
            },
          ],
          differentialConsiderations: [
            'Pulmonary embolism',
            'Aortic dissection',
            'Anxiety/panic attack',
            'GERD',
          ],
          suggestedWorkup: [
            'Serial troponins',
            'ECG',
            'Chest X-ray',
            'Consider CT angiography if PE suspected',
          ],
        },
        {
          condition: 'Heart Failure Exacerbation',
          icd10Code: 'I50.9',
          confidence: 'moderate',
          rationale:
            'Dyspnea may indicate fluid overload in patients with known heart failure.',
          supportingEvidence: [
            {
              type: 'lab',
              description: 'Elevated BNP consistent with volume overload',
            },
          ],
          suggestedWorkup: ['BNP', 'Chest X-ray', 'Echocardiogram'],
        },
      ],
      clinicalContext:
        'Patient presenting with cardiopulmonary symptoms requiring urgent evaluation.',
      limitations: [
        'Unable to review full medication history',
        'Prior cardiac workup not available for comparison',
      ],
      disclaimer:
        'This is AI-generated decision support only. Clinical judgment is required for all diagnostic and treatment decisions.',
    }
  }

  if (text.includes('fever') || text.includes('infection')) {
    return {
      suggestions: [
        {
          condition: 'Sepsis',
          icd10Code: 'A41.9',
          confidence: 'moderate',
          rationale:
            'Fever with systemic symptoms warrants sepsis evaluation.',
          supportingEvidence: [
            {
              type: 'vital',
              description: 'Fever and tachycardia present',
            },
            {
              type: 'lab',
              description: 'Elevated WBC count',
            },
          ],
          differentialConsiderations: [
            'Viral syndrome',
            'UTI',
            'Pneumonia',
            'Cellulitis',
          ],
          suggestedWorkup: [
            'Blood cultures x2',
            'Lactate',
            'Procalcitonin',
            'Urinalysis',
            'Chest X-ray',
          ],
        },
      ],
      clinicalContext: 'Patient with signs of systemic infection.',
      limitations: ['Source of infection not yet identified'],
      disclaimer:
        'This is AI-generated decision support only. Clinical judgment is required.',
    }
  }

  // Default response
  return {
    suggestions: [
      {
        condition: 'Further evaluation needed',
        icd10Code: 'R69',
        confidence: 'low',
        rationale:
          'The provided clinical information requires additional context for specific diagnostic suggestions.',
        supportingEvidence: [
          {
            type: 'note',
            description: selectedText.substring(0, 100),
          },
        ],
        suggestedWorkup: [
          'Complete history and physical',
          'Basic metabolic panel',
          'CBC with differential',
        ],
      },
    ],
    clinicalContext: 'Limited information available for analysis.',
    limitations: [
      'Insufficient clinical details provided',
      'Patient history not fully available',
    ],
    disclaimer:
      'This is AI-generated decision support only. Clinical judgment is required for all diagnostic and treatment decisions.',
  }
}
