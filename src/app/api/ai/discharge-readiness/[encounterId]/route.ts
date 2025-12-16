import { NextRequest, NextResponse } from 'next/server'
import type { DischargeReadinessOutput } from '@/lib/llm/schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: { encounterId: string } }
) {
  try {
    // For demo purposes, always return mock data
    // In production, this would integrate with FHIR and LLM
    const mockResponse = getMockDischargeReadiness()

    // Simulate a small delay for realism
    await new Promise((resolve) => setTimeout(resolve, 300))

    return NextResponse.json({
      success: true,
      data: mockResponse,
      mock: true,
    })
  } catch (error) {
    console.error('Discharge readiness error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to assess discharge readiness' },
      { status: 500 }
    )
  }
}

function getMockDischargeReadiness(): DischargeReadinessOutput {
  return {
    readinessLevel: 'READY_SOON',
    readinessScore: 75,
    readinessReasons: [
      'Vitals have been stable for 24 hours',
      'Patient tolerating oral medications',
      'Ambulating independently',
    ],
    blockingFactors: [
      {
        factor: 'Pending echocardiogram results',
        category: 'workup',
        details: 'Echo ordered yesterday, results expected today',
        estimatedResolutionTime: '4-6 hours',
        responsibleParty: 'Cardiology',
      },
      {
        factor: 'Home oxygen setup',
        category: 'logistical',
        details: 'Patient will need 2L NC at home, DME company notified',
        estimatedResolutionTime: '1-2 days',
        responsibleParty: 'Case Management',
      },
    ],
    clinicalStatus: {
      vitalsStable: true,
      vitalsNotes: 'BP 128/76, HR 72, RR 16, SpO2 96% on 2L NC',
      labsAcceptable: true,
      labsNotes: 'Creatinine improved from 1.8 to 1.2, WBC normalizing',
      symptomsControlled: true,
      symptomsNotes: 'Dyspnea improved, no chest pain',
      oxygenRequirement: '2L nasal cannula',
      mobilityStatus: 'Ambulating with walker, PT cleared for home',
    },
    followupNeeds: [
      {
        specialty: 'Cardiology',
        timeframe: 'within_1_week',
        reason: 'Post-CHF exacerbation follow-up',
        mode: 'in_person',
        priority: 'critical',
      },
      {
        specialty: 'Primary Care',
        timeframe: 'within_2_weeks',
        reason: 'Medication reconciliation and BP check',
        mode: 'either',
        priority: 'important',
      },
    ],
    pendingTests: [
      {
        testName: 'Echocardiogram',
        orderedDate: new Date().toISOString(),
        expectedResultDate: 'Today',
        whyItMattersPatient: 'This test shows how well your heart is pumping',
        whyItMattersClinician: 'Assess EF recovery post-diuresis',
        responsiblePhysicianRole: 'Cardiology',
        criticalForDischarge: true,
      },
    ],
    safetyChecks: [
      {
        item: 'Medication reconciliation completed',
        category: 'medication',
        completed: true,
        notes: 'All medications reviewed with patient',
      },
      {
        item: 'Home oxygen arranged',
        category: 'equipment',
        completed: false,
        notes: 'DME company contacted, delivery pending',
      },
      {
        item: 'Daily weight monitoring education',
        category: 'education',
        completed: true,
        notes: 'Patient verbalized understanding',
      },
      {
        item: 'Cardiology follow-up scheduled',
        category: 'followup',
        completed: false,
      },
    ],
    estimatedDischargeDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    dischargeDisposition: 'home_with_services',
    disclaimer:
      'This is an AI-generated assessment for decision support only. Clinical judgment is required for all discharge decisions.',
  }
}
