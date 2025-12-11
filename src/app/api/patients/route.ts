import { NextRequest, NextResponse } from 'next/server'
import type { Patient, Encounter, QuestionnaireResponse } from '@medplum/fhirtypes'

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

    // In a real implementation, you would:
    // 1. Save patient to FHIR server
    // 2. Save encounter to FHIR server
    // 3. Save questionnaire responses to FHIR server
    // 4. Create coverage resource for insurance
    // 5. Trigger any admission workflows

    // For now, we'll return success with the generated IDs
    // In production, this would integrate with Medplum or another FHIR server

    console.log('New patient admission:', {
      patient: patientResource,
      encounter: encounterResource,
      questionnaireResponses: questionnaireResponses.length,
      insurance
    })

    return NextResponse.json({
      success: true,
      patientId,
      encounterId,
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
  // Return mock patients list for now
  // In production, this would query the FHIR server
  
  const mockPatients = [
    { id: 'patient-1', name: 'Robert Johnson', mrn: 'MRN-001', age: 78, gender: 'male', status: 'active' },
    { id: 'patient-2', name: 'Sarah Williams', mrn: 'MRN-002', age: 58, gender: 'female', status: 'active' },
    { id: 'patient-3', name: 'John Smith', mrn: 'MRN-003', age: 65, gender: 'male', status: 'active' },
  ]

  return NextResponse.json({ patients: mockPatients })
}
