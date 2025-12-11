/**
 * Patient Resource Client
 * Typed client for FHIR Patient resources
 */

import type { Patient, Bundle } from '@medplum/fhirtypes'

export interface PatientSearchParams {
  name?: string
  identifier?: string
  birthdate?: string
  gender?: string
  _count?: number
}

export class PatientClient {
  constructor(
    private baseUrl: string,
    private getHeaders: () => HeadersInit
  ) {}

  async getById(id: string): Promise<Patient> {
    const response = await fetch(`${this.baseUrl}/Patient/${id}`, {
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch patient ${id}: ${response.status}`)
    }
    return response.json()
  }

  async search(params: PatientSearchParams = {}): Promise<Patient[]> {
    const searchParams = new URLSearchParams()
    if (params.name) searchParams.append('name', params.name)
    if (params.identifier) searchParams.append('identifier', params.identifier)
    if (params.birthdate) searchParams.append('birthdate', params.birthdate)
    if (params.gender) searchParams.append('gender', params.gender)
    if (params._count) searchParams.append('_count', params._count.toString())

    const query = searchParams.toString()
    const url = query ? `${this.baseUrl}/Patient?${query}` : `${this.baseUrl}/Patient`

    const response = await fetch(url, { headers: this.getHeaders() })
    if (!response.ok) {
      throw new Error(`Failed to search patients: ${response.status}`)
    }

    const bundle: Bundle = await response.json()
    return (bundle.entry || [])
      .map(e => e.resource as Patient)
      .filter(Boolean)
  }

  async getActiveInpatients(): Promise<Patient[]> {
    const response = await fetch(
      `${this.baseUrl}/Encounter?status=in-progress&class=IMP&_include=Encounter:patient`,
      { headers: this.getHeaders() }
    )
    if (!response.ok) {
      throw new Error(`Failed to fetch inpatients: ${response.status}`)
    }

    const bundle: Bundle = await response.json()
    const patients: Patient[] = []
    
    for (const entry of bundle.entry || []) {
      if (entry.resource?.resourceType === 'Patient') {
        patients.push(entry.resource as Patient)
      }
    }

    return patients
  }

  async create(patient: Omit<Patient, 'id'>): Promise<Patient> {
    const response = await fetch(`${this.baseUrl}/Patient`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...patient, resourceType: 'Patient' }),
    })
    if (!response.ok) {
      throw new Error(`Failed to create patient: ${response.status}`)
    }
    return response.json()
  }

  async update(id: string, patient: Patient): Promise<Patient> {
    const response = await fetch(`${this.baseUrl}/Patient/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(patient),
    })
    if (!response.ok) {
      throw new Error(`Failed to update patient ${id}: ${response.status}`)
    }
    return response.json()
  }
}

/**
 * Helper to format patient name
 */
export function formatPatientName(patient: Patient): string {
  const name = patient.name?.[0]
  if (!name) return 'Unknown'
  const given = name.given?.join(' ') || ''
  const family = name.family || ''
  return `${given} ${family}`.trim() || 'Unknown'
}

/**
 * Helper to calculate patient age
 */
export function calculatePatientAge(birthDate: string | undefined): number | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}
