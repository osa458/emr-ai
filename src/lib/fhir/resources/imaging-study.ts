/**
 * ImagingStudy Resource Client
 * Typed client for FHIR ImagingStudy resources
 */

import type { ImagingStudy, Bundle } from '@medplum/fhirtypes'

export interface ImagingStudySearchParams {
  patient?: string
  encounter?: string
  status?: string
  modality?: string
  started?: string
  _count?: number
  _sort?: string
}

export class ImagingStudyClient {
  constructor(
    private baseUrl: string,
    private getHeaders: () => HeadersInit
  ) {}

  async getById(id: string): Promise<ImagingStudy> {
    const response = await fetch(`${this.baseUrl}/ImagingStudy/${id}`, {
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch imaging study ${id}: ${response.status}`)
    }
    return response.json()
  }

  async search(params: ImagingStudySearchParams = {}): Promise<ImagingStudy[]> {
    const searchParams = new URLSearchParams()
    if (params.patient) searchParams.append('patient', params.patient)
    if (params.encounter) searchParams.append('encounter', params.encounter)
    if (params.status) searchParams.append('status', params.status)
    if (params.modality) searchParams.append('modality', params.modality)
    if (params.started) searchParams.append('started', params.started)
    if (params._count) searchParams.append('_count', params._count.toString())
    if (params._sort) searchParams.append('_sort', params._sort)

    const query = searchParams.toString()
    const url = query ? `${this.baseUrl}/ImagingStudy?${query}` : `${this.baseUrl}/ImagingStudy`

    const response = await fetch(url, { headers: this.getHeaders() })
    if (!response.ok) {
      throw new Error(`Failed to search imaging studies: ${response.status}`)
    }

    const bundle: Bundle = await response.json()
    return (bundle.entry || [])
      .map(e => e.resource as ImagingStudy)
      .filter(Boolean)
  }

  async getByPatient(patientId: string, params: Omit<ImagingStudySearchParams, 'patient'> = {}): Promise<ImagingStudy[]> {
    return this.search({ ...params, patient: patientId, _sort: params._sort || '-started' })
  }

  async getByEncounter(encounterId: string, params: Omit<ImagingStudySearchParams, 'encounter'> = {}): Promise<ImagingStudy[]> {
    return this.search({ ...params, encounter: encounterId, _sort: params._sort || '-started' })
  }

  async create(imagingStudy: Omit<ImagingStudy, 'id'>): Promise<ImagingStudy> {
    const response = await fetch(`${this.baseUrl}/ImagingStudy`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...imagingStudy, resourceType: 'ImagingStudy' }),
    })
    if (!response.ok) {
      throw new Error(`Failed to create imaging study: ${response.status}`)
    }
    return response.json()
  }

  async update(id: string, imagingStudy: ImagingStudy): Promise<ImagingStudy> {
    const response = await fetch(`${this.baseUrl}/ImagingStudy/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(imagingStudy),
    })
    if (!response.ok) {
      throw new Error(`Failed to update imaging study ${id}: ${response.status}`)
    }
    return response.json()
  }
}

/**
 * Helper to get modality display name
 */
export function getModalityDisplay(modality: string): string {
  const modalityMap: Record<string, string> = {
    'CT': 'CT Scan',
    'MR': 'MRI',
    'US': 'Ultrasound',
    'XR': 'X-Ray',
    'NM': 'Nuclear Medicine',
    'PT': 'PET Scan',
    'CR': 'Computed Radiography',
    'DX': 'Digital Radiography',
    'MG': 'Mammography',
    'RF': 'Fluoroscopy',
  }
  return modalityMap[modality] || modality
}

/**
 * Helper to format imaging study description
 */
export function formatImagingStudyDescription(study: ImagingStudy): string {
  const modality = study.modality?.[0]?.code || 'Unknown'
  const description = study.description || ''
  return description || getModalityDisplay(modality)
}
