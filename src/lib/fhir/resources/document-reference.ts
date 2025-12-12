/**
 * DocumentReference Resource Client
 * Typed client for FHIR DocumentReference resources
 */

import type { DocumentReference, Bundle } from '@medplum/fhirtypes'

export interface DocumentReferenceSearchParams {
  patient?: string
  encounter?: string
  status?: string
  type?: string
  category?: string
  date?: string
  _count?: number
  _sort?: string
}

export class DocumentReferenceClient {
  constructor(
    private baseUrl: string,
    private getHeaders: () => HeadersInit
  ) {}

  async getById(id: string): Promise<DocumentReference> {
    const response = await fetch(`${this.baseUrl}/DocumentReference/${id}`, {
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch document reference ${id}: ${response.status}`)
    }
    return response.json()
  }

  async search(params: DocumentReferenceSearchParams = {}): Promise<DocumentReference[]> {
    const searchParams = new URLSearchParams()
    if (params.patient) searchParams.append('patient', params.patient)
    if (params.encounter) searchParams.append('encounter', params.encounter)
    if (params.status) searchParams.append('status', params.status)
    if (params.type) searchParams.append('type', params.type)
    if (params.category) searchParams.append('category', params.category)
    if (params.date) searchParams.append('date', params.date)
    if (params._count) searchParams.append('_count', params._count.toString())
    if (params._sort) searchParams.append('_sort', params._sort)

    const query = searchParams.toString()
    const url = query ? `${this.baseUrl}/DocumentReference?${query}` : `${this.baseUrl}/DocumentReference`

    const response = await fetch(url, { headers: this.getHeaders() })
    if (!response.ok) {
      throw new Error(`Failed to search document references: ${response.status}`)
    }

    const bundle: Bundle = await response.json()
    return (bundle.entry || [])
      .map(e => e.resource as DocumentReference)
      .filter(Boolean)
  }

  async getByPatient(patientId: string, params: Omit<DocumentReferenceSearchParams, 'patient'> = {}): Promise<DocumentReference[]> {
    return this.search({ ...params, patient: patientId, _sort: params._sort || '-date' })
  }

  async getByEncounter(encounterId: string, params: Omit<DocumentReferenceSearchParams, 'encounter'> = {}): Promise<DocumentReference[]> {
    return this.search({ ...params, encounter: encounterId, _sort: params._sort || '-date' })
  }

  async getClinicalNotes(patientId: string, limit: number = 20): Promise<DocumentReference[]> {
    return this.search({ 
      patient: patientId, 
      category: 'clinical-note',
      _sort: '-date',
      _count: limit
    })
  }

  async getDischargeDocuments(encounterId: string): Promise<DocumentReference[]> {
    return this.search({ 
      encounter: encounterId, 
      type: 'discharge-summary'
    })
  }

  async create(docRef: Omit<DocumentReference, 'id'>): Promise<DocumentReference> {
    const response = await fetch(`${this.baseUrl}/DocumentReference`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...docRef, resourceType: 'DocumentReference' }),
    })
    if (!response.ok) {
      throw new Error(`Failed to create document reference: ${response.status}`)
    }
    return response.json()
  }

  async update(id: string, docRef: DocumentReference): Promise<DocumentReference> {
    const response = await fetch(`${this.baseUrl}/DocumentReference/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(docRef),
    })
    if (!response.ok) {
      throw new Error(`Failed to update document reference ${id}: ${response.status}`)
    }
    return response.json()
  }
}

/**
 * Helper to get document type display
 */
export function getDocumentTypeDisplay(docRef: DocumentReference): string {
  return docRef.type?.text ||
         docRef.type?.coding?.[0]?.display ||
         'Document'
}

/**
 * Helper to get document category display
 */
export function getDocumentCategoryDisplay(docRef: DocumentReference): string {
  const category = docRef.category?.[0]
  return category?.text ||
         category?.coding?.[0]?.display ||
         'Uncategorized'
}

/**
 * Helper to get document status display
 */
export function getDocumentStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    'current': 'Current',
    'superseded': 'Superseded',
    'entered-in-error': 'Error',
  }
  return statusMap[status] || status
}

/**
 * Helper to get document content URL
 */
export function getDocumentContentUrl(docRef: DocumentReference): string | null {
  const attachment = docRef.content?.[0]?.attachment
  return attachment?.url || null
}

/**
 * Helper to get document content type
 */
export function getDocumentContentType(docRef: DocumentReference): string {
  return docRef.content?.[0]?.attachment?.contentType || 'application/octet-stream'
}

/**
 * Helper to format document date
 */
export function formatDocumentDate(docRef: DocumentReference): string {
  const date = docRef.date || docRef.content?.[0]?.attachment?.creation
  if (!date) return 'Unknown date'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Helper to get author display
 */
export function getDocumentAuthor(docRef: DocumentReference): string {
  const author = docRef.author?.[0]
  return author?.display || author?.reference || 'Unknown'
}
