/**
 * Observation Resource Client
 * Handles vitals, labs, and other observations
 */

import type { Observation, Bundle } from '@medplum/fhirtypes'

export interface ObservationSearchParams {
  patient?: string
  encounter?: string
  category?: string
  code?: string
  date?: string
  _sort?: string
  _count?: number
}

export class ObservationClient {
  constructor(
    private baseUrl: string,
    private getHeaders: () => HeadersInit
  ) {}

  async getById(id: string): Promise<Observation> {
    const response = await fetch(`${this.baseUrl}/Observation/${id}`, {
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch observation ${id}: ${response.status}`)
    }
    return response.json()
  }

  async search(params: ObservationSearchParams = {}): Promise<Observation[]> {
    const searchParams = new URLSearchParams()
    if (params.patient) searchParams.append('patient', params.patient)
    if (params.encounter) searchParams.append('encounter', params.encounter)
    if (params.category) searchParams.append('category', params.category)
    if (params.code) searchParams.append('code', params.code)
    if (params.date) searchParams.append('date', params.date)
    if (params._sort) searchParams.append('_sort', params._sort)
    if (params._count) searchParams.append('_count', params._count.toString())

    const query = searchParams.toString()
    const url = query ? `${this.baseUrl}/Observation?${query}` : `${this.baseUrl}/Observation`

    const response = await fetch(url, { headers: this.getHeaders() })
    if (!response.ok) {
      throw new Error(`Failed to search observations: ${response.status}`)
    }

    const bundle: Bundle = await response.json()
    return (bundle.entry || [])
      .map(e => e.resource as Observation)
      .filter(Boolean)
  }

  async getVitals(patientId: string, options: { _count?: number } = {}): Promise<Observation[]> {
    return this.search({
      patient: patientId,
      category: 'vital-signs',
      _sort: '-date',
      _count: options._count || 50,
    })
  }

  async getLabs(patientId: string, options: { _count?: number } = {}): Promise<Observation[]> {
    return this.search({
      patient: patientId,
      category: 'laboratory',
      _sort: '-date',
      _count: options._count || 100,
    })
  }

  async getByEncounter(encounterId: string): Promise<Observation[]> {
    return this.search({
      encounter: encounterId,
      _sort: '-date',
      _count: 200,
    })
  }

  async create(observation: Omit<Observation, 'id'>): Promise<Observation> {
    const response = await fetch(`${this.baseUrl}/Observation`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...observation, resourceType: 'Observation' }),
    })
    if (!response.ok) {
      throw new Error(`Failed to create observation: ${response.status}`)
    }
    return response.json()
  }
}

/**
 * Format observation value for display
 */
export function formatObservationValue(obs: Observation): string {
  if (obs.valueQuantity) {
    return `${obs.valueQuantity.value} ${obs.valueQuantity.unit || ''}`
  }
  if (obs.valueString) {
    return obs.valueString
  }
  if (obs.valueCodeableConcept) {
    return obs.valueCodeableConcept.text || obs.valueCodeableConcept.coding?.[0]?.display || ''
  }
  return 'N/A'
}

/**
 * Get observation display name
 */
export function getObservationName(obs: Observation): string {
  return obs.code?.text || obs.code?.coding?.[0]?.display || 'Unknown'
}

/**
 * Check if observation is abnormal
 */
export function isAbnormal(obs: Observation): boolean {
  const interp = obs.interpretation?.[0]?.coding?.[0]?.code
  return interp === 'H' || interp === 'L' || interp === 'HH' || interp === 'LL'
}

/**
 * Get interpretation flag
 */
export function getInterpretationFlag(obs: Observation): string | null {
  const code = obs.interpretation?.[0]?.coding?.[0]?.code
  if (!code || code === 'N') return null
  return code
}
