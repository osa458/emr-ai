/**
 * MedicationAdministration Resource Client
 * Typed client for FHIR MedicationAdministration resources
 */

import type { MedicationAdministration, Bundle } from '@medplum/fhirtypes'

export interface MedicationAdministrationSearchParams {
  patient?: string
  encounter?: string
  status?: string
  medication?: string
  'effective-time'?: string
  _count?: number
  _sort?: string
}

export class MedicationAdministrationClient {
  constructor(
    private baseUrl: string,
    private getHeaders: () => HeadersInit
  ) {}

  async getById(id: string): Promise<MedicationAdministration> {
    const response = await fetch(`${this.baseUrl}/MedicationAdministration/${id}`, {
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch medication administration ${id}: ${response.status}`)
    }
    return response.json()
  }

  async search(params: MedicationAdministrationSearchParams = {}): Promise<MedicationAdministration[]> {
    const searchParams = new URLSearchParams()
    if (params.patient) searchParams.append('patient', params.patient)
    if (params.encounter) searchParams.append('encounter', params.encounter)
    if (params.status) searchParams.append('status', params.status)
    if (params.medication) searchParams.append('medication', params.medication)
    if (params['effective-time']) searchParams.append('effective-time', params['effective-time'])
    if (params._count) searchParams.append('_count', params._count.toString())
    if (params._sort) searchParams.append('_sort', params._sort)

    const query = searchParams.toString()
    const url = query ? `${this.baseUrl}/MedicationAdministration?${query}` : `${this.baseUrl}/MedicationAdministration`

    const response = await fetch(url, { headers: this.getHeaders() })
    if (!response.ok) {
      throw new Error(`Failed to search medication administrations: ${response.status}`)
    }

    const bundle: Bundle = await response.json()
    return (bundle.entry || [])
      .map(e => e.resource as MedicationAdministration)
      .filter(Boolean)
  }

  async getByPatient(patientId: string, params: Omit<MedicationAdministrationSearchParams, 'patient'> = {}): Promise<MedicationAdministration[]> {
    return this.search({ ...params, patient: patientId, _sort: params._sort || '-effective-time' })
  }

  async getByEncounter(encounterId: string, params: Omit<MedicationAdministrationSearchParams, 'encounter'> = {}): Promise<MedicationAdministration[]> {
    return this.search({ ...params, encounter: encounterId, _sort: params._sort || '-effective-time' })
  }

  async getActiveIVMedications(encounterId: string): Promise<MedicationAdministration[]> {
    return this.search({ encounter: encounterId, status: 'in-progress' })
  }

  async create(medAdmin: Omit<MedicationAdministration, 'id'>): Promise<MedicationAdministration> {
    const response = await fetch(`${this.baseUrl}/MedicationAdministration`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...medAdmin, resourceType: 'MedicationAdministration' }),
    })
    if (!response.ok) {
      throw new Error(`Failed to create medication administration: ${response.status}`)
    }
    return response.json()
  }

  async update(id: string, medAdmin: MedicationAdministration): Promise<MedicationAdministration> {
    const response = await fetch(`${this.baseUrl}/MedicationAdministration/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(medAdmin),
    })
    if (!response.ok) {
      throw new Error(`Failed to update medication administration ${id}: ${response.status}`)
    }
    return response.json()
  }
}

/**
 * Helper to get medication name from administration record
 */
export function getAdministrationMedicationName(medAdmin: MedicationAdministration): string {
  if (medAdmin.medicationCodeableConcept) {
    return medAdmin.medicationCodeableConcept.text ||
           medAdmin.medicationCodeableConcept.coding?.[0]?.display ||
           'Unknown Medication'
  }
  if (medAdmin.medicationReference) {
    return medAdmin.medicationReference.display || 'Unknown Medication'
  }
  return 'Unknown Medication'
}

/**
 * Helper to get administration status display
 */
export function getAdministrationStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    'in-progress': 'In Progress',
    'not-done': 'Not Done',
    'on-hold': 'On Hold',
    'completed': 'Completed',
    'entered-in-error': 'Error',
    'stopped': 'Stopped',
    'unknown': 'Unknown',
  }
  return statusMap[status] || status
}

/**
 * Helper to check if medication is IV
 */
export function isIVMedication(medAdmin: MedicationAdministration): boolean {
  const route = medAdmin.dosage?.route?.coding?.[0]?.code
  return route === 'IV' || route === '47625008' // SNOMED code for intravenous route
}

/**
 * Helper to get dosage display string
 */
export function getDosageDisplay(medAdmin: MedicationAdministration): string {
  const dosage = medAdmin.dosage
  if (!dosage) return ''
  
  const dose = dosage.dose
  const rate = dosage.rateQuantity || dosage.rateRatio
  
  let display = ''
  if (dose) {
    display = `${dose.value} ${dose.unit || ''}`
  }
  if (rate && 'value' in rate) {
    display += display ? ` at ${rate.value} ${rate.unit || ''}/hr` : `${rate.value} ${rate.unit || ''}/hr`
  }
  
  return display.trim()
}
