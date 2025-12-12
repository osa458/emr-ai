/**
 * AI Assist Context Query Helper
 * Gathers comprehensive patient context for AI-powered clinical decision support
 */

import type {
  Patient,
  Encounter,
  Condition,
  Observation,
  Procedure,
  MedicationRequest,
  DiagnosticReport,
  ImagingStudy,
  DocumentReference,
} from '@medplum/fhirtypes'

export interface AIAssistContext {
  patient: Patient
  encounter: Encounter
  conditions: Condition[]
  recentVitals: Observation[]
  recentLabs: Observation[]
  medications: MedicationRequest[]
  procedures: Procedure[]
  imagingStudies: ImagingStudy[]
  diagnosticReports: DiagnosticReport[]
  recentNotes: DocumentReference[]
}

/**
 * Fetches comprehensive clinical context for AI assist features
 * Used by diagnostic assist, billing assist, and summarization endpoints
 */
export async function getAIAssistContext(
  fhirClient: any,
  encounterId: string
): Promise<AIAssistContext> {
  // Get encounter first
  const encounter = await fhirClient.encounter.getById(encounterId)
  const patientRef = encounter.subject?.reference

  if (!patientRef) {
    throw new Error('Encounter has no patient reference')
  }

  const patientId = patientRef.split('/')[1]

  // Fetch all related data in parallel for performance
  const [
    patient,
    conditions,
    vitals,
    labs,
    medications,
    procedures,
    imagingStudies,
    diagnosticReports,
    notes,
  ] = await Promise.all([
    fhirClient.patient.getById(patientId),
    fhirClient.condition.getByPatient(patientId).catch(() => []),
    fhirClient.observation.getVitals(patientId, { _count: 50 }).catch(() => []),
    fhirClient.observation.getLabs(patientId, { _count: 100 }).catch(() => []),
    fhirClient.medicationRequest.getByPatient(patientId).catch(() => []),
    fhirClient.procedure?.getByPatient?.(patientId).catch(() => []) || [],
    fhirClient.imagingStudy?.getByPatient?.(patientId).catch(() => []) || [],
    fhirClient.diagnosticReport?.getByPatient?.(patientId).catch(() => []) || [],
    fhirClient.documentReference?.getByPatient?.(patientId, { _count: 20 }).catch(() => []) || [],
  ])

  return {
    patient,
    encounter,
    conditions: conditions || [],
    recentVitals: vitals || [],
    recentLabs: labs || [],
    medications: medications || [],
    procedures: procedures || [],
    imagingStudies: imagingStudies || [],
    diagnosticReports: diagnosticReports || [],
    recentNotes: notes || [],
  }
}

/**
 * Format vitals for prompt building
 */
export function formatVitalsForPrompt(vitals: Observation[]): string {
  const latest: Record<string, string> = {}
  vitals.slice(0, 20).forEach((v) => {
    const name = v.code?.text || v.code?.coding?.[0]?.display
    if (name && !latest[name]) {
      latest[name] = `${v.valueQuantity?.value} ${v.valueQuantity?.unit || ''}`
    }
  })
  return Object.entries(latest)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n')
}

/**
 * Format labs for prompt building
 */
export function formatLabsForPrompt(labs: Observation[]): string {
  const latest: Record<string, string> = {}
  labs.slice(0, 30).forEach((l) => {
    const name = l.code?.text || l.code?.coding?.[0]?.display
    if (name && !latest[name]) {
      const value = l.valueQuantity?.value ?? l.valueString ?? 'N/A'
      const unit = l.valueQuantity?.unit || ''
      const flag = l.interpretation?.[0]?.coding?.[0]?.code || ''
      latest[name] = `${value} ${unit} ${flag ? `(${flag})` : ''}`
    }
  })
  return Object.entries(latest)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n')
}

/**
 * Format conditions for prompt building
 */
export function formatConditionsForPrompt(conditions: Condition[]): string {
  return conditions
    .map((c) => `- ${c.code?.text || c.code?.coding?.[0]?.display || 'Unknown'}`)
    .join('\n')
}

/**
 * Format medications for prompt building
 */
export function formatMedicationsForPrompt(medications: MedicationRequest[]): string {
  return medications
    .map(
      (m) =>
        `- ${m.medicationCodeableConcept?.text || m.medicationCodeableConcept?.coding?.[0]?.display || 'Unknown'}`
    )
    .join('\n')
}
