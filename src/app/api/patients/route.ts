import { NextRequest, NextResponse } from 'next/server'
import type { Patient, Encounter, QuestionnaireResponse } from '@medplum/fhirtypes'
import { aidbox } from '@/lib/aidbox'

// Generate a unique ID
function generateId() {
  return `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function generateMRN() {
  return `MRN-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patient, admission, insurance, intakeResponse, medicalHistoryResponse, consentResponse } = body

    // Generate IDs
    const patientId = generateId()
    const encounterId = `encounter-${Date.now()}`
    const mrn = generateMRN()

    // Build the complete patient resource
    const patientResource: Patient = {
      ...patient,
      id: patientId,
      resourceType: 'Patient',
      identifier: [
        {
          use: 'official',
          type: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
              code: 'MR',
              display: 'Medical Record Number'
            }]
          },
          value: mrn
        }
      ],
      active: true
    }

    // Create the encounter for admission
    const encounterResource: Encounter = {
      resourceType: 'Encounter',
      id: encounterId,
      status: 'in-progress',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: admission?.admissionType === 'Inpatient' ? 'IMP' : 
              admission?.admissionType === 'Emergency' ? 'EMER' : 
              admission?.admissionType === 'Observation' ? 'OBSENC' : 'AMB',
        display: admission?.admissionType || 'Inpatient'
      },
      subject: {
        reference: `Patient/${patientId}`,
        display: `${patient.name?.[0]?.given?.join(' ')} ${patient.name?.[0]?.family}`
      },
      period: {
        start: new Date().toISOString()
      },
      reasonCode: admission?.admitDiagnosis ? [{
        text: admission.admitDiagnosis
      }] : undefined,
      location: admission?.assignedRoom ? [{
        location: {
          display: admission.assignedRoom
        },
        status: 'active'
      }] : undefined,
      hospitalization: {
        admitSource: {
          text: admission?.admissionSource || 'Emergency Room'
        }
      }
    }

    // Store questionnaire responses linked to patient
    const questionnaireResponses: QuestionnaireResponse[] = []

    if (intakeResponse) {
      questionnaireResponses.push({
        ...intakeResponse,
        id: `qr-intake-${Date.now()}`,
        resourceType: 'QuestionnaireResponse',
        questionnaire: 'Questionnaire/intake-form',
        status: 'completed',
        subject: { reference: `Patient/${patientId}` },
        encounter: { reference: `Encounter/${encounterId}` },
        authored: new Date().toISOString()
      })
    }

    if (medicalHistoryResponse) {
      questionnaireResponses.push({
        ...medicalHistoryResponse,
        id: `qr-medical-history-${Date.now()}`,
        resourceType: 'QuestionnaireResponse',
        questionnaire: 'Questionnaire/medical-history',
        status: 'completed',
        subject: { reference: `Patient/${patientId}` },
        encounter: { reference: `Encounter/${encounterId}` },
        authored: new Date().toISOString()
      })
    }

    if (consentResponse) {
      questionnaireResponses.push({
        ...consentResponse,
        id: `qr-consent-${Date.now()}`,
        resourceType: 'QuestionnaireResponse',
        questionnaire: 'Questionnaire/consent-form',
        status: 'completed',
        subject: { reference: `Patient/${patientId}` },
        encounter: { reference: `Encounter/${encounterId}` },
        authored: new Date().toISOString()
      })
    }

    // Save to Aidbox using SDK
    const createdPatient = await aidbox.resource.create('Patient', patientResource as any)
    const createdEncounter = await aidbox.resource.create('Encounter', {
      ...encounterResource,
      subject: { reference: `Patient/${createdPatient.id}` }
    } as any)

    // Save questionnaire responses
    for (const qr of questionnaireResponses) {
      await aidbox.resource.create('QuestionnaireResponse', {
        ...qr,
        subject: { reference: `Patient/${createdPatient.id}` },
        encounter: { reference: `Encounter/${createdEncounter.id}` }
      } as any)
    }

    console.log('New patient admission saved to Aidbox:', {
      patientId: createdPatient.id,
      encounterId: createdEncounter.id,
      questionnaireResponses: questionnaireResponses.length
    })

    return NextResponse.json({
      success: true,
      patientId: createdPatient.id,
      encounterId: createdEncounter.id,
      mrn,
      message: 'Patient admitted successfully'
    })

  } catch (error) {
    console.error('Patient admission error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to admit patient' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const _count = parseInt(searchParams.get('_count') || '50')
    const name = searchParams.get('name')

    // Use Aidbox SDK
    let query = aidbox.resource.list('Patient').count(_count)
    if (name) {
      query = query.where('name', name)
    }

    const bundle = await query
    const patients = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || patients.length

    return NextResponse.json({
      success: true,
      data: patients,
      total,
    })
  } catch (error: any) {
    console.error('Patients fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch patients' },
      { status: 500 }
    )
  }
}
