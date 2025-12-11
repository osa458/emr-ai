/**
 * Condition Resource Client
 */

import type { Condition, Bundle } from '@medplum/fhirtypes'

export interface ConditionSearchParams {
  patient?: string
  encounter?: string
  'clinical-status'?: string
  category?: string
  _count?: number
}

export class ConditionClient {
  constructor(
    private baseUrl: string,
    private getHeaders: () => HeadersInit
  ) {}

  async getById(id: string): Promise<Condition> {
    const response = await fetch(`${this.baseUrl}/Condition/${id}`, {
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch condition ${id}: ${response.status}`)
    }
    return response.json()
  }

  async search(params: ConditionSearchParams = {}): Promise<Condition[]> {
    const searchParams = new URLSearchParams()
    if (params.patient) searchParams.append('patient', params.patient)
    if (params.encounter) searchParams.append('encounter', params.encounter)
    if (params['clinical-status']) searchParams.append('clinical-status', params['clinical-status'])
    if (params.category) searchParams.append('category', params.category)
    if (params._count) searchParams.append('_count', params._count.toString())

    const query = searchParams.toString()
    const url = query ? `${this.baseUrl}/Condition?${query}` : `${this.baseUrl}/Condition`

    const response = await fetch(url, { headers: this.getHeaders() })
    if (!response.ok) {
      throw new Error(`Failed to search conditions: ${response.status}`)
    }

    const bundle: Bundle = await response.json()
    return (bundle.entry || [])
      .map(e => e.resource as Condition)
      .filter(Boolean)
  }

  async getByPatient(patientId: string): Promise<Condition[]> {
    return this.search({ patient: patientId })
  }

  async getActiveByPatient(patientId: string): Promise<Condition[]> {
    return this.search({ patient: patientId, 'clinical-status': 'active' })
  }

  async getByEncounter(encounterId: string): Promise<Condition[]> {
    return this.search({ encounter: encounterId })
  }

  async create(condition: Omit<Condition, 'id'>): Promise<Condition> {
    const response = await fetch(`${this.baseUrl}/Condition`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...condition, resourceType: 'Condition' }),
    })
    if (!response.ok) {
      throw new Error(`Failed to create condition: ${response.status}`)
    }
    return response.json()
  }

  async update(id: string, condition: Condition): Promise<Condition> {
    const response = await fetch(`${this.baseUrl}/Condition/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(condition),
    })
    if (!response.ok) {
      throw new Error(`Failed to update condition ${id}: ${response.status}`)
    }
    return response.json()
  }
}

/**
 * Get condition display name
 */
export function getConditionName(condition: Condition): string {
  return condition.code?.text || condition.code?.coding?.[0]?.display || 'Unknown Condition'
}

/**
 * Check if condition is active
 */
export function isActiveCondition(condition: Condition): boolean {
  return condition.clinicalStatus?.coding?.[0]?.code === 'active'
}

/**
 * Get ICD-10 code from condition
 */
export function getICD10Code(condition: Condition): string | null {
  const coding = condition.code?.coding?.find(c => 
    c.system?.includes('icd-10') || c.system?.includes('ICD')
  )
  return coding?.code || null
}
