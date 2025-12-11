/**
 * MedicationRequest Resource Client
 */

import type { MedicationRequest, Bundle } from '@medplum/fhirtypes'

export interface MedicationRequestSearchParams {
  patient?: string
  encounter?: string
  status?: string
  intent?: string
  _count?: number
}

export class MedicationRequestClient {
  constructor(
    private baseUrl: string,
    private getHeaders: () => HeadersInit
  ) {}

  async getById(id: string): Promise<MedicationRequest> {
    const response = await fetch(`${this.baseUrl}/MedicationRequest/${id}`, {
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch medication request ${id}: ${response.status}`)
    }
    return response.json()
  }

  async search(params: MedicationRequestSearchParams = {}): Promise<MedicationRequest[]> {
    const searchParams = new URLSearchParams()
    if (params.patient) searchParams.append('patient', params.patient)
    if (params.encounter) searchParams.append('encounter', params.encounter)
    if (params.status) searchParams.append('status', params.status)
    if (params.intent) searchParams.append('intent', params.intent)
    if (params._count) searchParams.append('_count', params._count.toString())

    const query = searchParams.toString()
    const url = query ? `${this.baseUrl}/MedicationRequest?${query}` : `${this.baseUrl}/MedicationRequest`

    const response = await fetch(url, { headers: this.getHeaders() })
    if (!response.ok) {
      throw new Error(`Failed to search medication requests: ${response.status}`)
    }

    const bundle: Bundle = await response.json()
    return (bundle.entry || [])
      .map(e => e.resource as MedicationRequest)
      .filter(Boolean)
  }

  async getByPatient(patientId: string): Promise<MedicationRequest[]> {
    return this.search({ patient: patientId })
  }

  async getActiveByPatient(patientId: string): Promise<MedicationRequest[]> {
    return this.search({ patient: patientId, status: 'active' })
  }

  async getByEncounter(encounterId: string): Promise<MedicationRequest[]> {
    return this.search({ encounter: encounterId })
  }

  async create(medRequest: Omit<MedicationRequest, 'id'>): Promise<MedicationRequest> {
    const response = await fetch(`${this.baseUrl}/MedicationRequest`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...medRequest, resourceType: 'MedicationRequest' }),
    })
    if (!response.ok) {
      throw new Error(`Failed to create medication request: ${response.status}`)
    }
    return response.json()
  }
}

/**
 * Get medication name
 */
export function getMedicationName(medRequest: MedicationRequest): string {
  return medRequest.medicationCodeableConcept?.text ||
    medRequest.medicationCodeableConcept?.coding?.[0]?.display ||
    'Unknown Medication'
}

/**
 * Get dosage instruction as string
 */
export function getDosageString(medRequest: MedicationRequest): string {
  const dosage = medRequest.dosageInstruction?.[0]
  if (!dosage) return ''

  const parts: string[] = []
  
  const dose = dosage.doseAndRate?.[0]?.doseQuantity
  if (dose) {
    parts.push(`${dose.value} ${dose.unit || ''}`)
  }

  const timing = dosage.timing?.code?.text || dosage.timing?.repeat?.frequency
  if (timing) {
    parts.push(String(timing))
  }

  const route = dosage.route?.text || dosage.route?.coding?.[0]?.display
  if (route) {
    parts.push(route)
  }

  return parts.join(' ').trim()
}

/**
 * Check if medication is high-risk
 */
export function isHighRiskMedication(medRequest: MedicationRequest): boolean {
  const name = getMedicationName(medRequest).toLowerCase()
  const highRiskKeywords = [
    'warfarin', 'heparin', 'insulin', 'opioid', 'morphine', 'fentanyl',
    'hydromorphone', 'methadone', 'digoxin', 'chemotherapy', 'anticoagulant'
  ]
  return highRiskKeywords.some(keyword => name.includes(keyword))
}
