/**
 * Morning Snapshot Query
 * Fetches all inpatient data needed for morning triage
 */

import type { 
  Patient, 
  Encounter, 
  Observation, 
  Condition, 
  MedicationRequest,
  DiagnosticReport,
  Task,
  Bundle 
} from '@medplum/fhirtypes'

export interface PatientSnapshot {
  patient: Patient
  encounter: Encounter
  recentVitals: Observation[]
  recentLabs: Observation[]
  conditions: Condition[]
  medications: MedicationRequest[]
  pendingTests: DiagnosticReport[]
  openConsults: Task[]
}

export interface MorningSnapshot {
  generatedAt: string
  patients: PatientSnapshot[]
  totalPatients: number
}

/**
 * Get morning snapshot for all inpatients
 */
export async function getMorningSnapshot(
  fhirBaseUrl: string,
  accessToken?: string
): Promise<MorningSnapshot> {
  const headers: HeadersInit = {
    'Content-Type': 'application/fhir+json',
  }
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  // Fetch all in-progress inpatient encounters with patients
  const encounterBundle = await fetch(
    `${fhirBaseUrl}/Encounter?status=in-progress&class=IMP&_include=Encounter:patient&_count=100`,
    { headers }
  ).then(r => r.json()) as Bundle

  const patients: PatientSnapshot[] = []
  const patientMap = new Map<string, Patient>()
  const encounters: Encounter[] = []

  // Parse bundle entries
  for (const entry of encounterBundle.entry || []) {
    if (entry.resource?.resourceType === 'Patient') {
      patientMap.set(`Patient/${entry.resource.id}`, entry.resource as Patient)
    } else if (entry.resource?.resourceType === 'Encounter') {
      encounters.push(entry.resource as Encounter)
    }
  }

  // Fetch clinical data for each patient
  for (const encounter of encounters) {
    const patientRef = encounter.subject?.reference
    if (!patientRef) continue

    const patient = patientMap.get(patientRef)
    if (!patient) continue

    const patientId = patient.id!
    const encounterId = encounter.id!

    // Parallel fetch of clinical data
    const [vitals, labs, conditions, medications, pendingTests, consults] = await Promise.all([
      fetchRecentVitals(fhirBaseUrl, patientId, headers),
      fetchRecentLabs(fhirBaseUrl, patientId, headers),
      fetchActiveConditions(fhirBaseUrl, patientId, headers),
      fetchActiveMedications(fhirBaseUrl, patientId, encounterId, headers),
      fetchPendingTests(fhirBaseUrl, patientId, headers),
      fetchOpenConsults(fhirBaseUrl, patientId, headers),
    ])

    patients.push({
      patient,
      encounter,
      recentVitals: vitals,
      recentLabs: labs,
      conditions,
      medications,
      pendingTests,
      openConsults: consults,
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    patients,
    totalPatients: patients.length,
  }
}

async function fetchRecentVitals(
  baseUrl: string,
  patientId: string,
  headers: HeadersInit
): Promise<Observation[]> {
  const bundle = await fetch(
    `${baseUrl}/Observation?patient=${patientId}&category=vital-signs&_sort=-date&_count=50`,
    { headers }
  ).then(r => r.json()) as Bundle

  return (bundle.entry || [])
    .map(e => e.resource as Observation)
    .filter(Boolean)
}

async function fetchRecentLabs(
  baseUrl: string,
  patientId: string,
  headers: HeadersInit
): Promise<Observation[]> {
  const bundle = await fetch(
    `${baseUrl}/Observation?patient=${patientId}&category=laboratory&_sort=-date&_count=100`,
    { headers }
  ).then(r => r.json()) as Bundle

  return (bundle.entry || [])
    .map(e => e.resource as Observation)
    .filter(Boolean)
}

async function fetchActiveConditions(
  baseUrl: string,
  patientId: string,
  headers: HeadersInit
): Promise<Condition[]> {
  const bundle = await fetch(
    `${baseUrl}/Condition?patient=${patientId}&clinical-status=active`,
    { headers }
  ).then(r => r.json()) as Bundle

  return (bundle.entry || [])
    .map(e => e.resource as Condition)
    .filter(Boolean)
}

async function fetchActiveMedications(
  baseUrl: string,
  patientId: string,
  encounterId: string,
  headers: HeadersInit
): Promise<MedicationRequest[]> {
  const bundle = await fetch(
    `${baseUrl}/MedicationRequest?patient=${patientId}&status=active&encounter=${encounterId}`,
    { headers }
  ).then(r => r.json()) as Bundle

  return (bundle.entry || [])
    .map(e => e.resource as MedicationRequest)
    .filter(Boolean)
}

async function fetchPendingTests(
  baseUrl: string,
  patientId: string,
  headers: HeadersInit
): Promise<DiagnosticReport[]> {
  const bundle = await fetch(
    `${baseUrl}/DiagnosticReport?patient=${patientId}&status=registered,partial,preliminary`,
    { headers }
  ).then(r => r.json()) as Bundle

  return (bundle.entry || [])
    .map(e => e.resource as DiagnosticReport)
    .filter(Boolean)
}

async function fetchOpenConsults(
  baseUrl: string,
  patientId: string,
  headers: HeadersInit
): Promise<Task[]> {
  const bundle = await fetch(
    `${baseUrl}/Task?patient=${patientId}&status=requested,in-progress`,
    { headers }
  ).then(r => r.json()) as Bundle

  return (bundle.entry || [])
    .map(e => e.resource as Task)
    .filter(Boolean)
}

/**
 * Format vitals for AI prompt
 */
export function formatVitalsForPrompt(vitals: Observation[]): string {
  const latestByType = new Map<string, Observation>()
  
  for (const v of vitals) {
    const code = v.code?.coding?.[0]?.code || v.code?.text || 'unknown'
    if (!latestByType.has(code)) {
      latestByType.set(code, v)
    }
  }

  return Array.from(latestByType.values())
    .map(v => {
      const name = v.code?.text || v.code?.coding?.[0]?.display || 'Unknown'
      const value = v.valueQuantity?.value ?? v.valueString ?? 'N/A'
      const unit = v.valueQuantity?.unit || ''
      return `- ${name}: ${value} ${unit}`
    })
    .join('\n')
}

/**
 * Format labs for AI prompt
 */
export function formatLabsForPrompt(labs: Observation[]): string {
  const latestByType = new Map<string, Observation>()
  
  for (const lab of labs) {
    const code = lab.code?.coding?.[0]?.code || lab.code?.text || 'unknown'
    if (!latestByType.has(code)) {
      latestByType.set(code, lab)
    }
  }

  return Array.from(latestByType.values())
    .slice(0, 20) // Limit to 20 most recent unique labs
    .map(lab => {
      const name = lab.code?.text || lab.code?.coding?.[0]?.display || 'Unknown'
      const value = lab.valueQuantity?.value ?? lab.valueString ?? 'N/A'
      const unit = lab.valueQuantity?.unit || ''
      const interp = lab.interpretation?.[0]?.coding?.[0]?.code || ''
      const flag = interp === 'H' ? '⬆' : interp === 'L' ? '⬇' : ''
      return `- ${name}: ${value} ${unit} ${flag}`
    })
    .join('\n')
}
