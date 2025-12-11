'use client'

import { 
  initServices, 
  extractBundleResources, 
  getReference, 
  makeReference,
  formatFHIRDate,
  formatFHIRDateTime,
  parseFHIRDate,
  parseFHIRDateTime,
  uuid4,
  type WithId,
  type SearchParams,
  type ResourcesMap
} from '@beda.software/fhir-react'
import type { Resource, Bundle, Patient, Observation, MedicationRequest, Encounter, Condition } from '@medplum/fhirtypes'

// Initialize FHIR services - will connect to Medplum when available
const FHIR_BASE_URL = process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL || 'http://localhost:8103/fhir/R4'

let fhirServices: ReturnType<typeof initServices> | null = null

export function getFHIRServices() {
  if (!fhirServices) {
    fhirServices = initServices(FHIR_BASE_URL)
  }
  return fhirServices
}

// Re-export useful utilities from Beda
export {
  extractBundleResources,
  getReference,
  makeReference,
  formatFHIRDate,
  formatFHIRDateTime,
  parseFHIRDate,
  parseFHIRDateTime,
  uuid4,
  type WithId,
  type SearchParams,
  type ResourcesMap
}

// Patient helpers
export async function getPatient(patientId: string) {
  const services = getFHIRServices()
  return services.getFHIRResource<Patient>({ reference: `Patient/${patientId}` })
}

export async function searchPatients(params: SearchParams) {
  const services = getFHIRServices()
  return services.getFHIRResources<Patient>('Patient', params)
}

// Observation (Labs/Vitals) helpers
export async function getPatientObservations(patientId: string, category?: string) {
  const services = getFHIRServices()
  const params: SearchParams = {
    subject: `Patient/${patientId}`,
    _sort: '-date',
    _count: 100
  }
  if (category) {
    params.category = category
  }
  return services.getFHIRResources<Observation>('Observation', params)
}

export async function getPatientVitals(patientId: string) {
  return getPatientObservations(patientId, 'vital-signs')
}

export async function getPatientLabs(patientId: string) {
  return getPatientObservations(patientId, 'laboratory')
}

// MedicationRequest helpers
export async function getPatientMedications(patientId: string, status?: string) {
  const services = getFHIRServices()
  const params: SearchParams = {
    subject: `Patient/${patientId}`,
    _include: ['MedicationRequest:medication'],
    _sort: '-authoredon'
  }
  if (status) {
    params.status = status
  }
  return services.getFHIRResources<MedicationRequest>('MedicationRequest', params)
}

export async function createMedicationRequest(medicationRequest: MedicationRequest) {
  const services = getFHIRServices()
  return services.createFHIRResource(medicationRequest)
}

export async function updateMedicationRequest(medicationRequest: WithId<MedicationRequest>) {
  const services = getFHIRServices()
  return services.updateFHIRResource(medicationRequest)
}

// Encounter helpers
export async function getPatientEncounters(patientId: string) {
  const services = getFHIRServices()
  return services.getFHIRResources<Encounter>('Encounter', {
    subject: `Patient/${patientId}`,
    _sort: '-date',
    _count: 50
  })
}

export async function getCurrentEncounter(patientId: string) {
  const services = getFHIRServices()
  return services.findFHIRResource<Encounter>('Encounter', {
    subject: `Patient/${patientId}`,
    status: 'in-progress',
    _sort: '-date'
  })
}

// Condition helpers
export async function getPatientConditions(patientId: string, clinicalStatus?: string) {
  const services = getFHIRServices()
  const params: SearchParams = {
    subject: `Patient/${patientId}`,
    _sort: '-recorded-date'
  }
  if (clinicalStatus) {
    params['clinical-status'] = clinicalStatus
  }
  return services.getFHIRResources<Condition>('Condition', params)
}

export async function getActiveConditions(patientId: string) {
  return getPatientConditions(patientId, 'active')
}

// Bundle resource extraction helper
export function extractResources<T extends Resource>(bundle: Bundle<T>): ResourcesMap<T> {
  return extractBundleResources(bundle)
}

// Create a new FHIR resource with generated ID
export function createResourceWithId<T extends Resource>(resource: Omit<T, 'id'>): T {
  return {
    ...resource,
    id: uuid4()
  } as T
}
