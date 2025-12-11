import { NextRequest, NextResponse } from 'next/server'
import { mockLLMRequest } from '@/lib/llm/client'
import type { DischargeMaterialsOutput } from '@/lib/llm/schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: { encounterId: string } }
) {
  try {
    const { encounterId } = params

    // For demo, return mock discharge materials
    const mockResponse = getMockDischargeMaterials()
    const response = await mockLLMRequest<DischargeMaterialsOutput>(mockResponse)

    return NextResponse.json({
      success: true,
      data: response.data,
      usage: response.usage,
      latencyMs: response.latencyMs,
    })
  } catch (error) {
    console.error('Discharge materials error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate discharge materials' },
      { status: 500 }
    )
  }
}

function getMockDischargeMaterials(): DischargeMaterialsOutput {
  return {
    patientInstructions: {
      greeting:
        'Dear Mr. Smith, Thank you for trusting us with your care. Here is important information about your hospital stay and what to do at home.',
      hospitalSummary:
        'You were in the hospital for 4 days because your heart was not pumping fluid as well as it should. This caused extra fluid to build up in your body, making it hard to breathe. We gave you medicines to remove the extra fluid, and you are feeling much better now.',
      diagnosisExplanations: [
        {
          diagnosisName: 'Heart Failure (CHF)',
          whatItMeans:
            'Your heart muscle is weaker than normal and has trouble pumping blood efficiently. This causes fluid to back up in your lungs and legs.',
          whatWeDid:
            'We gave you IV diuretics (water pills) to remove 8 pounds of extra fluid. We also adjusted your heart medications.',
          ongoingCare:
            'Take your medications every day. Weigh yourself each morning. Call us if you gain more than 3 pounds in one day or 5 pounds in one week.',
        },
      ],
      homeExpectations:
        'You may feel tired for the first few days at home. This is normal. Your energy will improve over the next 1-2 weeks as your body adjusts.',
      activityRestrictions: [
        'No heavy lifting over 10 pounds for 2 weeks',
        'Walk for 10-15 minutes twice daily, gradually increasing',
        'Rest when you feel tired',
        'You may climb stairs slowly',
      ],
      dietInstructions:
        'Follow a low-sodium diet (less than 2000mg of salt per day). Limit fluids to 2 liters (about 8 cups) per day. Avoid processed foods, canned soups, and fast food.',
      warningSigns: {
        callClinic: [
          'Weight gain of 3+ pounds in one day',
          'Increased swelling in legs or ankles',
          'Needing extra pillows to sleep',
          'Mild increase in shortness of breath',
        ],
        goToUrgentCare: [
          'Fever over 101°F',
          'Unable to keep medications down',
          'Dizziness that does not go away with rest',
        ],
        callOrGoToER: [
          'Severe shortness of breath at rest',
          'Chest pain or pressure',
          'Fainting or near-fainting',
          'Confusion or difficulty speaking',
        ],
      },
      pendingTestsExplained: [
        {
          testName: 'Echocardiogram',
          whatItChecks:
            'This ultrasound test shows how well your heart is pumping',
          whenToExpectResults: 'Results will be reviewed at your cardiology appointment',
          whoWillContact: 'Dr. Johnson from Cardiology',
        },
      ],
      emergencyContacts: {
        clinicPhone: '(555) 123-4567',
        afterHoursPhone: '(555) 123-4568',
        nurseLinePhone: '(555) 999-NURSE',
      },
    },
    medicationSection: {
      summary:
        'You are going home with some new medications and some changes to your old medications. Please review each medication carefully.',
      medications: [
        {
          medicationName: 'Furosemide (Lasix)',
          status: 'changed',
          dosage: '40 mg',
          frequency: 'Once in the morning',
          purpose: 'Removes extra fluid from your body',
          specialInstructions:
            'Take in the morning so you are not up at night using the bathroom. Take with food.',
          sideEffectsToWatch: [
            'Dizziness when standing up',
            'Muscle cramps',
            'Increased thirst',
          ],
        },
        {
          medicationName: 'Lisinopril',
          status: 'continued',
          dosage: '10 mg',
          frequency: 'Once daily',
          purpose: 'Protects your heart and kidneys, lowers blood pressure',
          sideEffectsToWatch: ['Dry cough', 'Dizziness'],
        },
        {
          medicationName: 'Metoprolol Succinate',
          status: 'new',
          dosage: '25 mg',
          frequency: 'Once daily',
          purpose: 'Helps your heart beat more efficiently',
          specialInstructions: 'Do not stop taking suddenly',
          sideEffectsToWatch: ['Fatigue', 'Cold hands or feet', 'Slow heart rate'],
        },
        {
          medicationName: 'Spironolactone',
          status: 'new',
          dosage: '25 mg',
          frequency: 'Once daily',
          purpose: 'Protects your heart and helps remove fluid',
          sideEffectsToWatch: ['Breast tenderness', 'High potassium'],
        },
      ],
      generalMedicationTips: [
        'Take all medications at the same time each day',
        'Use a pill box to help you remember',
        'Do not stop any medication without talking to your doctor first',
        'Bring all your medications to every doctor appointment',
      ],
    },
    followupPlan: {
      summary:
        'You have several important appointments scheduled. Please attend all of them.',
      appointments: [
        {
          providerType: 'Cardiologist',
          timeframe: 'Within 7 days',
          purpose: 'Review your heart function and adjust medications',
          whatToExpect:
            'The doctor will listen to your heart, review your weight log, and may order blood tests.',
          questionsToAsk: [
            'What is my current heart function (EF)?',
            'Are my medications working well?',
            'What activities can I do?',
          ],
        },
        {
          providerType: 'Primary Care Doctor',
          timeframe: 'Within 14 days',
          purpose: 'Overall health check and medication review',
          whatToExpect: 'General exam, blood pressure check, lab review',
        },
      ],
      pendingTestFollowup: [
        {
          testName: 'Echocardiogram',
          responsibleProvider: 'Cardiology',
          expectedTimeframe: 'Results at cardiology appointment',
        },
      ],
    },
    clinicianSummary: {
      briefHospitalCourse:
        '65M with HFrEF (EF 35%) admitted for acute decompensated heart failure. Presented with dyspnea, orthopnea, and 3+ pitting edema. Diuresed 8L with IV Lasix. Transitioned to oral diuretics with good response. Started on guideline-directed medical therapy.',
      dischargeDiagnoses: [
        'Acute on chronic systolic heart failure, decompensated',
        'Type 2 diabetes mellitus',
        'Hypertension',
        'CKD Stage 3',
      ],
      keyInterventions: [
        'IV diuresis with furosemide',
        'Initiated metoprolol and spironolactone',
        'Sodium and fluid restriction education',
      ],
      pendingItems: ['Outpatient echocardiogram to reassess EF'],
      followupNeeds: [
        'Cardiology in 7 days',
        'PCP in 14 days',
        'Labs (BMP) in 1 week',
      ],
    },
    readingLevel: '6th-8th grade',
    generatedAt: new Date().toISOString(),
  }
}
