/**
 * CarePlan Resource Client
 * Typed client for FHIR CarePlan resources
 */

import type { CarePlan, Bundle } from '@medplum/fhirtypes'

export interface CarePlanSearchParams {
  patient?: string
  encounter?: string
  status?: string
  category?: string
  intent?: string
  _count?: number
  _sort?: string
}

export class CarePlanClient {
  constructor(
    private baseUrl: string,
    private getHeaders: () => HeadersInit
  ) {}

  async getById(id: string): Promise<CarePlan> {
    const response = await fetch(`${this.baseUrl}/CarePlan/${id}`, {
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch care plan ${id}: ${response.status}`)
    }
    return response.json()
  }

  async search(params: CarePlanSearchParams = {}): Promise<CarePlan[]> {
    const searchParams = new URLSearchParams()
    if (params.patient) searchParams.append('patient', params.patient)
    if (params.encounter) searchParams.append('encounter', params.encounter)
    if (params.status) searchParams.append('status', params.status)
    if (params.category) searchParams.append('category', params.category)
    if (params.intent) searchParams.append('intent', params.intent)
    if (params._count) searchParams.append('_count', params._count.toString())
    if (params._sort) searchParams.append('_sort', params._sort)

    const query = searchParams.toString()
    const url = query ? `${this.baseUrl}/CarePlan?${query}` : `${this.baseUrl}/CarePlan`

    const response = await fetch(url, { headers: this.getHeaders() })
    if (!response.ok) {
      throw new Error(`Failed to search care plans: ${response.status}`)
    }

    const bundle: Bundle = await response.json()
    return (bundle.entry || [])
      .map(e => e.resource as CarePlan)
      .filter(Boolean)
  }

  async getByPatient(patientId: string, params: Omit<CarePlanSearchParams, 'patient'> = {}): Promise<CarePlan[]> {
    return this.search({ ...params, patient: patientId })
  }

  async getByEncounter(encounterId: string, params: Omit<CarePlanSearchParams, 'encounter'> = {}): Promise<CarePlan[]> {
    return this.search({ ...params, encounter: encounterId })
  }

  async getActiveCarePlans(patientId: string): Promise<CarePlan[]> {
    return this.search({ patient: patientId, status: 'active' })
  }

  async getDischargeCarePlans(encounterId: string): Promise<CarePlan[]> {
    return this.search({ encounter: encounterId, category: 'discharge' })
  }

  async create(carePlan: Omit<CarePlan, 'id'>): Promise<CarePlan> {
    const response = await fetch(`${this.baseUrl}/CarePlan`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...carePlan, resourceType: 'CarePlan' }),
    })
    if (!response.ok) {
      throw new Error(`Failed to create care plan: ${response.status}`)
    }
    return response.json()
  }

  async update(id: string, carePlan: CarePlan): Promise<CarePlan> {
    const response = await fetch(`${this.baseUrl}/CarePlan/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(carePlan),
    })
    if (!response.ok) {
      throw new Error(`Failed to update care plan ${id}: ${response.status}`)
    }
    return response.json()
  }
}

/**
 * Helper to get care plan status display
 */
export function getCarePlanStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    'draft': 'Draft',
    'active': 'Active',
    'on-hold': 'On Hold',
    'revoked': 'Revoked',
    'completed': 'Completed',
    'entered-in-error': 'Entered in Error',
    'unknown': 'Unknown',
  }
  return statusMap[status] || status
}

/**
 * Helper to extract goals from care plan
 */
export function extractCarePlanGoals(carePlan: CarePlan): string[] {
  return (carePlan.goal || [])
    .map(g => g.display || g.reference || '')
    .filter(Boolean)
}

/**
 * Helper to extract activities from care plan
 */
export function extractCarePlanActivities(carePlan: CarePlan): string[] {
  return (carePlan.activity || [])
    .map(a => a.detail?.description || a.detail?.code?.text || '')
    .filter(Boolean)
}
