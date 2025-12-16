/**
 * FHIR Adapter Factory
 * Provides a pluggable interface so the app can swap FHIR backends (Aidbox, Mock, future)
 */

import type {
  Questionnaire,
  QuestionnaireResponse,
  Patient,
  Bundle,
} from '@medplum/fhirtypes'
import { aidboxFetch } from '@/lib/aidbox'

export type FhirProvider = 'aidbox' | 'mock'

export interface FhirAdapter {
  name: string
  baseUrl: string
  listQuestionnaires: (count?: number) => Promise<Questionnaire[]>
  getQuestionnaire: (id: string) => Promise<Questionnaire>
  saveQuestionnaireResponse: (response: QuestionnaireResponse) => Promise<QuestionnaireResponse>
  getPatient: (id: string) => Promise<Patient>
  // TODO: add encounter/condition/observation/medication/diagnostic-report fetchers
  searchPatients: (params?: Record<string, string | number>) => Promise<{ patients: Patient[]; total: number }>
}

/**
 * Aidbox Adapter (basic auth; standard FHIR endpoints)
 */
class AidboxAdapter implements FhirAdapter {
  name: string
  baseUrl: string

  constructor(baseUrl: string) {
    this.name = 'aidbox'
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  private async request(path: string, init?: RequestInit) {
    const res = await aidboxFetch(path, init)
    if (!res.ok) {
      throw new Error(`Aidbox request failed: ${res.status} ${res.statusText}`)
    }
    return res.json()
  }

  async listQuestionnaires(count = 500): Promise<Questionnaire[]> {
    const bundle: Bundle<Questionnaire> = await this.request(`/Questionnaire?_count=${count}`)
    return (bundle.entry || []).map((e) => e.resource as Questionnaire)
  }

  async getQuestionnaire(id: string): Promise<Questionnaire> {
    return this.request(`/Questionnaire/${id}`)
  }

  async saveQuestionnaireResponse(response: QuestionnaireResponse): Promise<QuestionnaireResponse> {
    if (response.id) {
      return this.request(`/QuestionnaireResponse/${response.id}`, {
        method: 'PUT',
        body: JSON.stringify(response),
      })
    }
    return this.request(`/QuestionnaireResponse`, {
      method: 'POST',
      body: JSON.stringify(response),
    })
  }

  async getPatient(id: string): Promise<Patient> {
    return this.request(`/Patient/${id}`)
  }

  async searchPatients(params: Record<string, string | number> = {}): Promise<{ patients: Patient[]; total: number }> {
    const sp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => sp.append(k, String(v)))
    const query = sp.toString()
    const bundle: Bundle<Patient> = await this.request(`/Patient${query ? `?${query}` : ''}`)
    const patients = (bundle.entry || []).map((e) => e.resource as Patient)
    const total = (bundle as any).total || patients.length
    return { patients, total }
  }
}

/**
 * Mock Adapter (limited data for offline/demo)
 */
const mockQuestionnaires: Questionnaire[] = [
  {
    resourceType: 'Questionnaire',
    id: 'intake-form',
    status: 'active',
    title: 'Patient Intake Form',
    item: [
      { linkId: 'name', type: 'string', text: 'Full Name', required: true },
      { linkId: 'dob', type: 'date', text: 'Date of Birth', required: true },
      { linkId: 'gender', type: 'choice', text: 'Gender', answerOption: [
        { valueString: 'Male' }, { valueString: 'Female' }, { valueString: 'Other' }
      ]},
    ],
  },
]

class MockAdapter implements FhirAdapter {
  name = 'mock'
  baseUrl = 'mock://'

  async listQuestionnaires(): Promise<Questionnaire[]> {
    return mockQuestionnaires
  }

  async getQuestionnaire(id: string): Promise<Questionnaire> {
    const found = mockQuestionnaires.find((q) => q.id === id)
    if (!found) throw new Error('Mock questionnaire not found')
    return found
  }

  async saveQuestionnaireResponse(response: QuestionnaireResponse): Promise<QuestionnaireResponse> {
    return { ...response, id: response.id || `mock-${Date.now()}` }
  }

  async getPatient(): Promise<Patient> {
    throw new Error('Mock adapter: patient fetch not implemented')
  }

  async searchPatients(): Promise<{ patients: Patient[]; total: number }> {
    return { patients: [], total: 0 }
  }
}

let cachedAdapter: FhirAdapter | null = null

export function getFhirAdapter(): FhirAdapter {
  if (cachedAdapter) return cachedAdapter

  const provider = (process.env.FHIR_PROVIDER as FhirProvider) || 'aidbox'
  const aidboxBase = process.env.AIDBOX_BASE_URL || 'https://aoadhslfxc.edge.aidbox.app'

  switch (provider) {
    case 'aidbox':
      cachedAdapter = new AidboxAdapter(aidboxBase)
      break
    case 'mock':
      cachedAdapter = new MockAdapter()
      break
    default:
      cachedAdapter = new AidboxAdapter(aidboxBase)
      break
  }

  return cachedAdapter
}

export function resetFhirAdapter() {
  cachedAdapter = null
}
