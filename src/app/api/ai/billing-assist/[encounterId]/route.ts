import { NextRequest, NextResponse } from 'next/server'
import { mockLLMRequest } from '@/lib/llm/client'
import type { BillingAssistOutput } from '@/lib/llm/schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: { encounterId: string } }
) {
  try {
    const { encounterId } = params

    // For demo, return mock billing suggestions
    const mockResponse = getMockBillingAssist()
    const response = await mockLLMRequest<BillingAssistOutput>(mockResponse)

    return NextResponse.json({
      success: true,
      data: response.data,
      usage: response.usage,
      latencyMs: response.latencyMs,
    })
  } catch (error) {
    console.error('Billing assist error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate billing suggestions' },
      { status: 500 }
    )
  }
}

function getMockBillingAssist(): BillingAssistOutput {
  return {
    suggestedCodes: [
      {
        codeType: 'ICD-10',
        code: 'I50.23',
        description: 'Acute on chronic systolic (congestive) heart failure',
        category: 'principal_diagnosis',
        evidence: [
          {
            source: 'H&P',
            quote: 'Patient presents with acute decompensation of known HFrEF',
          },
          {
            source: 'Labs',
            quote: 'BNP 850, elevated from baseline',
          },
        ],
        documentationTip:
          'Document the acuity (acute on chronic) and type (systolic) for specificity',
      },
      {
        codeType: 'ICD-10',
        code: 'E11.65',
        description: 'Type 2 diabetes mellitus with hyperglycemia',
        category: 'cc',
        evidence: [
          {
            source: 'Labs',
            quote: 'Admission glucose 245 mg/dL',
          },
          {
            source: 'Medication list',
            quote: 'Insulin sliding scale initiated',
          },
        ],
        complianceNotes: 'Hyperglycemia documented and treated during stay',
      },
      {
        codeType: 'ICD-10',
        code: 'N18.3',
        description: 'Chronic kidney disease, stage 3',
        category: 'cc',
        evidence: [
          {
            source: 'Labs',
            quote: 'Creatinine 1.8, eGFR 42',
          },
        ],
      },
      {
        codeType: 'ICD-10',
        code: 'I10',
        description: 'Essential (primary) hypertension',
        category: 'secondary_diagnosis',
        evidence: [
          {
            source: 'Vital signs',
            quote: 'Admission BP 158/92',
          },
        ],
      },
      {
        codeType: 'ICD-10',
        code: 'Z87.891',
        description: 'Personal history of nicotine dependence',
        category: 'secondary_diagnosis',
        evidence: [
          {
            source: 'Social history',
            quote: 'Former smoker, quit 5 years ago',
          },
        ],
        documentationTip: 'Document pack-years and quit date if available',
      },
    ],
    missingDocumentation: [
      {
        codeAtRisk: 'J96.01 - Acute respiratory failure with hypoxia',
        whatIsMissing:
          'Documentation of oxygen requirement on admission. Patient was on 4L NC but specific SpO2 on room air not documented.',
        suggestedAddition:
          'Add to H&P: "SpO2 88% on room air, requiring 4L NC to maintain SpO2 >92%"',
      },
      {
        codeAtRisk: 'E87.1 - Hyponatremia',
        whatIsMissing:
          'Sodium was 128 on admission but not addressed in assessment/plan.',
        suggestedAddition:
          'Add to assessment: "Hyponatremia, likely dilutional in setting of volume overload. Fluid restriction initiated."',
      },
    ],
    cmiImpact: {
      currentEstimate: '1.2',
      potentialWithSuggestions: '1.8',
      explanation:
        'Adding respiratory failure with hypoxia (MCC) and hyponatremia (CC) with proper documentation would significantly increase case weight.',
    },
    complianceWarnings: [
      'Ensure all conditions were present on admission (POA) or developed during stay',
      'Document clinical significance of all secondary diagnoses',
      'Avoid coding conditions that were ruled out',
    ],
    disclaimer:
      'This is AI-generated coding assistance only. All codes must be verified by certified coders and physicians. Final coding is subject to documentation review.',
  }
}
