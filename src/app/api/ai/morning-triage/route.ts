import { NextRequest, NextResponse } from 'next/server'
import { mockLLMRequest } from '@/lib/llm/client'
import type { MorningTriageOutput } from '@/lib/llm/schemas'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const service = searchParams.get('service')
    const location = searchParams.get('location')

    // For demo, return mock triage data
    // In production, would fetch from FHIR and call LLM
    const mockResponse = getMockMorningTriage()
    const response = await mockLLMRequest<MorningTriageOutput>(mockResponse)

    return NextResponse.json({
      success: true,
      data: response.data,
      usage: response.usage,
      latencyMs: response.latencyMs,
    })
  } catch (error) {
    console.error('Morning triage error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate morning triage' },
      { status: 500 }
    )
  }
}

function getMockMorningTriage(): MorningTriageOutput {
  return {
    generatedAt: new Date().toISOString(),
    totalPatients: 5,
    criticalCount: 1,
    highRiskCount: 2,
    patients: [
      {
        patientId: 'patient-1',
        patientName: 'Robert Johnson',
        location: 'Room 412',
        riskLevel: 'critical',
        riskScore: 85,
        priorityRank: 1,
        riskFactors: [
          {
            factor: 'Acute kidney injury',
            severity: 'critical',
            details: 'Creatinine 2.8, up from 1.4 yesterday',
            trend: 'worsening',
          },
          {
            factor: 'Hypotension',
            severity: 'high',
            details: 'BP 88/52 this morning, was 110/70',
            trend: 'worsening',
          },
        ],
        deteriorationRisk: {
          level: 'high',
          indicators: ['Rising creatinine', 'Declining blood pressure', 'Decreased urine output'],
          timeframe: 'Next 12-24 hours',
        },
        quickWins: [
          {
            action: 'Review fluid status and consider volume challenge',
            rationale: 'May be pre-renal component',
            priority: 'high',
            timeToComplete: '15 min',
          },
          {
            action: 'Hold nephrotoxic medications',
            rationale: 'Currently on NSAID and ACE-i',
            priority: 'high',
            timeToComplete: '5 min',
          },
        ],
        keyUpdates: ['Creatinine doubled overnight', 'Nephrology consulted'],
      },
      {
        patientId: 'patient-2',
        patientName: 'Sarah Williams',
        location: 'Room 305',
        riskLevel: 'high',
        riskScore: 70,
        priorityRank: 2,
        riskFactors: [
          {
            factor: 'COPD exacerbation',
            severity: 'high',
            details: 'Increased O2 requirement overnight',
            trend: 'worsening',
          },
        ],
        deteriorationRisk: {
          level: 'moderate',
          indicators: ['Increasing oxygen requirement', 'Persistent tachypnea'],
        },
        quickWins: [
          {
            action: 'Consider BiPAP if further decompensation',
            rationale: 'Currently on 4L NC, up from 2L',
            priority: 'medium',
            timeToComplete: '10 min',
          },
        ],
        keyUpdates: ['O2 increased from 2L to 4L overnight'],
      },
      {
        patientId: 'patient-3',
        patientName: 'John Smith',
        location: 'Room 218',
        riskLevel: 'high',
        riskScore: 65,
        priorityRank: 3,
        riskFactors: [
          {
            factor: 'CHF exacerbation',
            severity: 'high',
            details: 'Weight up 2kg despite diuresis',
            trend: 'stable',
          },
        ],
        deteriorationRisk: {
          level: 'moderate',
          indicators: ['Persistent volume overload', 'Suboptimal diuretic response'],
        },
        quickWins: [
          {
            action: 'Increase Lasix to 80mg IV BID',
            rationale: 'Inadequate response to current 40mg',
            priority: 'high',
            timeToComplete: '5 min',
          },
        ],
        keyUpdates: ['Net positive 500mL yesterday'],
      },
      {
        patientId: 'patient-4',
        patientName: 'Maria Garcia',
        location: 'Room 422',
        riskLevel: 'moderate',
        riskScore: 45,
        priorityRank: 4,
        riskFactors: [
          {
            factor: 'Community acquired pneumonia',
            severity: 'moderate',
            details: 'Day 3 of antibiotics, improving',
            trend: 'improving',
          },
        ],
        deteriorationRisk: {
          level: 'low',
          indicators: [],
        },
        quickWins: [
          {
            action: 'Consider IV to PO conversion',
            rationale: 'Afebrile x48h, tolerating diet',
            priority: 'medium',
            timeToComplete: '5 min',
          },
        ],
        keyUpdates: ['WBC down from 14 to 9'],
      },
      {
        patientId: 'patient-5',
        patientName: 'Michael Brown',
        location: 'Room 108',
        riskLevel: 'low',
        riskScore: 25,
        priorityRank: 5,
        riskFactors: [
          {
            factor: 'Cellulitis',
            severity: 'moderate',
            details: 'Erythema improving',
            trend: 'improving',
          },
        ],
        deteriorationRisk: {
          level: 'low',
          indicators: [],
        },
        quickWins: [
          {
            action: 'Discharge planning - likely ready today',
            rationale: 'Afebrile, cellulitis resolving, can complete PO antibiotics',
            priority: 'medium',
            timeToComplete: '20 min',
          },
        ],
        keyUpdates: ['Ready for discharge pending pharmacy'],
      },
    ],
    systemAlerts: [
      {
        type: 'critical_lab',
        message: 'Robert Johnson: Creatinine critical at 2.8 mg/dL',
        patientId: 'patient-1',
      },
    ],
    disclaimer:
      'This AI-generated triage is for decision support only. Clinical judgment is required.',
  }
}
