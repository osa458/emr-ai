import type {
  Patient,
  Encounter,
  Condition,
  Observation,
  MedicationRequest,
  DiagnosticReport,
} from '@medplum/fhirtypes'
import { formatPatientName } from './resources/patient'

export interface ChartSnapshot {
  patient: {
    id: string
    name: string
    mrn?: string
    age?: number
    gender?: string
    location?: string
    admitDate?: string
  }
  vitals: Observation[]
  labs: Observation[]
  conditions: Condition[]
  medications: MedicationRequest[]
  imaging: DiagnosticReport[]
  encounter?: Encounter
}

type Input = {
  patient: Patient
  encounters: Encounter[]
  conditions: Condition[]
  vitals: Observation[]
  labs: Observation[]
  meds: MedicationRequest[]
  imaging: DiagnosticReport[]
}

export function mapChartSnapshot(input: Input): ChartSnapshot {
  const { patient, encounters, conditions, vitals, labs, meds, imaging } = input
  const birthDate = patient.birthDate ? new Date(patient.birthDate) : null
  const age = birthDate ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined
  const encounter = encounters?.[0]
  return {
    patient: {
      id: patient.id || '',
      name: formatPatientName(patient),
      mrn: patient.identifier?.[0]?.value,
      age,
      gender: patient.gender,
      location: encounter?.location?.[0]?.location?.display || patient.address?.[0]?.text,
      admitDate: encounter?.period?.start,
    },
    vitals,
    labs,
    conditions,
    medications: meds,
    imaging,
    encounter,
  }
}
