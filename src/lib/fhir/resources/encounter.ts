/**
 * Encounter Resource Client
 */

import type { Encounter, Bundle } from '@medplum/fhirtypes'

export interface EncounterSearchParams {
  patient?: string
  status?: string
  class?: string
  date?: string
  _count?: number
  _include?: string | string[]
}

export class EncounterClient {
  constructor(
    private baseUrl: string,
    private getHeaders: () => HeadersInit
  ) {}

  async getById(id: string): Promise<Encounter> {
    const response = await fetch(`${this.baseUrl}/Encounter/${id}`, {
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch encounter ${id}: ${response.status}`)
    }
    return response.json()
  }

  async search(params: EncounterSearchParams = {}): Promise<Encounter[]> {
    const searchParams = new URLSearchParams()
    if (params.patient) searchParams.append('patient', params.patient)
    if (params.status) searchParams.append('status', params.status)
    if (params.class) searchParams.append('class', params.class)
    if (params.date) searchParams.append('date', params.date)
    if (params._count) searchParams.append('_count', params._count.toString())
    if (params._include) {
      const includes = Array.isArray(params._include) ? params._include : [params._include]
      includes.forEach(inc => searchParams.append('_include', inc))
    }

    const query = searchParams.toString()
    const url = query ? `${this.baseUrl}/Encounter?${query}` : `${this.baseUrl}/Encounter`

    const response = await fetch(url, { headers: this.getHeaders() })
    if (!response.ok) {
      throw new Error(`Failed to search encounters: ${response.status}`)
    }

    const bundle: Bundle = await response.json()
    return (bundle.entry || [])
      .map(e => e.resource as Encounter)
      .filter(r => r?.resourceType === 'Encounter')
  }

  async getByPatient(patientId: string): Promise<Encounter[]> {
    return this.search({ patient: patientId, _count: 50 })
  }

  async getActiveInpatient(patientId: string): Promise<Encounter | null> {
    const encounters = await this.search({
      patient: patientId,
      status: 'in-progress',
      class: 'IMP',
      _count: 1,
    })
    return encounters[0] || null
  }

  async getAllActiveInpatients(): Promise<Encounter[]> {
    return this.search({
      status: 'in-progress',
      class: 'IMP',
      _count: 100,
    })
  }

  async create(encounter: Omit<Encounter, 'id'>): Promise<Encounter> {
    const response = await fetch(`${this.baseUrl}/Encounter`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...encounter, resourceType: 'Encounter' }),
    })
    if (!response.ok) {
      throw new Error(`Failed to create encounter: ${response.status}`)
    }
    return response.json()
  }

  async update(id: string, encounter: Encounter): Promise<Encounter> {
    const response = await fetch(`${this.baseUrl}/Encounter/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(encounter),
    })
    if (!response.ok) {
      throw new Error(`Failed to update encounter ${id}: ${response.status}`)
    }
    return response.json()
  }
}

/**
 * Get length of stay in days
 */
export function getLengthOfStay(encounter: Encounter): number {
  if (!encounter.period?.start) return 0
  const start = new Date(encounter.period.start)
  const end = encounter.period?.end ? new Date(encounter.period.end) : new Date()
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Get room/location from encounter
 */
export function getEncounterLocation(encounter: Encounter): string {
  return encounter.location?.[0]?.location?.display || 'Unknown'
}
