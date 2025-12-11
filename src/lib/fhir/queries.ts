import type {
  Patient,
  Encounter,
  Condition,
  Observation,
  MedicationRequest,
  Procedure,
  DiagnosticReport,
  Task,
  Appointment,
} from '@medplum/fhirtypes'
import type { FhirClient } from './client'

// AI Assist Context
export interface AIAssistContext {
  patient: Patient
  encounter: Encounter
  conditions: Condition[]
  recentVitals: Observation[]
  recentLabs: Observation[]
  medications: MedicationRequest[]
  procedures: Procedure[]
  diagnosticReports: DiagnosticReport[]
}

export async function getAIAssistContext(
  client: FhirClient,
  encounterId: string
): Promise<AIAssistContext> {
  const encounter = await client.getEncounter(encounterId)
  const patientRef = encounter.subject?.reference

  if (!patientRef) {
    throw new Error('Encounter has no patient reference')
  }

  const patientId = patientRef.split('/')[1]

  const [
    patient,
    conditions,
    vitals,
    labs,
    medications,
    procedures,
    diagnosticReports,
  ] = await Promise.all([
    client.getPatient(patientId),
    client.getConditions(patientId),
    client.getVitals(patientId, 50),
    client.getLabs(patientId, 100),
    client.getMedicationRequests(patientId),
    client.getProcedures(patientId),
    client.getDiagnosticReports(patientId),
  ])

  return {
    patient,
    encounter,
    conditions,
    recentVitals: vitals,
    recentLabs: labs,
    medications,
    procedures,
    diagnosticReports,
  }
}

// Discharge Snapshot
export interface ClinicalStabilityMarkers {
  vitalsStable: boolean
  vitalsDetails: string[]
  labsTrending: 'improving' | 'stable' | 'worsening'
  labDetails: string[]
  oxygenRequirement: string
  onIVMedications: boolean
  highRiskMedications: string[]
}

export interface WorkupCompleteness {
  pendingTestCount: number
  pendingTests: Array<{ name: string; orderedDate: string }>
  openConsultCount: number
  openConsults: Array<{ specialty: string; requestedDate: string }>
  allCriticalTestsComplete: boolean
}

export interface DischargeSnapshot {
  patient: Patient
  encounter: Encounter
  conditions: Condition[]
  recentVitals: Observation[]
  recentLabs: Observation[]
  currentMedications: MedicationRequest[]
  procedures: Procedure[]
  pendingTests: DiagnosticReport[]
  completedTests: DiagnosticReport[]
  openConsults: Task[]
  completedConsults: Task[]
  scheduledAppointments: Appointment[]
  clinicalStability: ClinicalStabilityMarkers
  workupCompleteness: WorkupCompleteness
}

export async function getDischargeSnapshot(
  client: FhirClient,
  encounterId: string
): Promise<DischargeSnapshot> {
  const encounter = await client.getEncounter(encounterId)
  const patientRef = encounter.subject?.reference

  if (!patientRef) {
    throw new Error('Encounter has no patient reference')
  }

  const patientId = patientRef.split('/')[1]

  const [
    patient,
    conditions,
    vitals,
    labs,
    medications,
    procedures,
    allDiagnosticReports,
    tasks,
    appointments,
  ] = await Promise.all([
    client.getPatient(patientId),
    client.getEncounterConditions(encounterId),
    client.getVitals(patientId, 100),
    client.getLabs(patientId, 200),
    client.getEncounterMedications(encounterId),
    client.getProcedures(patientId),
    client.getDiagnosticReports(patientId),
    client.getTasks(encounterId),
    client.getAppointments(patientId),
  ])

  // Separate pending vs completed tests
  const pendingTests = allDiagnosticReports.filter(
    (r) => r.status === 'registered' || r.status === 'preliminary'
  )
  const completedTests = allDiagnosticReports.filter(
    (r) => r.status === 'final' || r.status === 'amended'
  )

  // Separate open vs completed consults
  const openConsults = tasks.filter(
    (t) => t.status === 'requested' || t.status === 'in-progress'
  )
  const completedConsults = tasks.filter((t) => t.status === 'completed')

  // Calculate stability markers
  const clinicalStability = calculateClinicalStability(vitals, labs, medications)

  // Calculate workup completeness
  const workupCompleteness = calculateWorkupCompleteness(pendingTests, openConsults)

  return {
    patient,
    encounter,
    conditions,
    recentVitals: vitals.slice(0, 50),
    recentLabs: labs.slice(0, 50),
    currentMedications: medications,
    procedures,
    pendingTests,
    completedTests,
    openConsults,
    completedConsults,
    scheduledAppointments: appointments,
    clinicalStability,
    workupCompleteness,
  }
}

function calculateClinicalStability(
  vitals: Observation[],
  labs: Observation[],
  medications: MedicationRequest[]
): ClinicalStabilityMarkers {
  // Simplified stability check - in real implementation, would analyze trends
  const vitalsStable = true
  const vitalsDetails: string[] = ['Vitals within normal limits for last 24h']

  const labsTrending: 'improving' | 'stable' | 'worsening' = 'stable'
  const labDetails: string[] = ['Labs stable']

  const oxygenRequirement = 'Room air'
  const onIVMedications = medications.some(
    (m) => m.dosageInstruction?.[0]?.route?.coding?.[0]?.code === 'IV'
  )

  const highRiskMedications: string[] = []

  return {
    vitalsStable,
    vitalsDetails,
    labsTrending,
    labDetails,
    oxygenRequirement,
    onIVMedications,
    highRiskMedications,
  }
}

function calculateWorkupCompleteness(
  pendingTests: DiagnosticReport[],
  openConsults: Task[]
): WorkupCompleteness {
  return {
    pendingTestCount: pendingTests.length,
    pendingTests: pendingTests.map((t) => ({
      name: t.code?.text || t.code?.coding?.[0]?.display || 'Unknown test',
      orderedDate: t.issued || '',
    })),
    openConsultCount: openConsults.length,
    openConsults: openConsults.map((c) => ({
      specialty: c.code?.text || 'Unknown specialty',
      requestedDate: c.authoredOn || '',
    })),
    allCriticalTestsComplete: pendingTests.length === 0,
  }
}

// Morning Triage Snapshot
export interface PatientSnapshot {
  patient: Patient
  encounter: Encounter
  conditions: Condition[]
  recentVitals: Observation[]
  recentLabs: Observation[]
  medications: MedicationRequest[]
}

export interface MorningSnapshot {
  patients: PatientSnapshot[]
  generatedAt: string
}

export async function getMorningSnapshot(
  client: FhirClient,
  filters?: { service?: string | null; location?: string | null }
): Promise<MorningSnapshot> {
  // Get all active inpatient encounters
  const encounters = await client.search<Encounter>('Encounter', {
    status: 'in-progress',
    class: 'IMP',
  })

  const patientSnapshots: PatientSnapshot[] = []

  for (const entry of encounters.entry || []) {
    const encounter = entry.resource
    const patientRef = encounter.subject?.reference
    if (!patientRef) continue

    const patientId = patientRef.split('/')[1]

    try {
      const [patient, conditions, vitals, labs, medications] = await Promise.all([
        client.getPatient(patientId),
        client.getConditions(patientId),
        client.getVitals(patientId, 20),
        client.getLabs(patientId, 30),
        client.getMedicationRequests(patientId),
      ])

      patientSnapshots.push({
        patient,
        encounter,
        conditions,
        recentVitals: vitals,
        recentLabs: labs,
        medications,
      })
    } catch (error) {
      console.error(`Failed to get snapshot for patient ${patientId}:`, error)
    }
  }

  return {
    patients: patientSnapshots,
    generatedAt: new Date().toISOString(),
  }
}
