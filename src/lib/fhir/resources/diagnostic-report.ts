/**
 * DiagnosticReport Resource Client
 */

import type { DiagnosticReport, Bundle } from '@medplum/fhirtypes'

export interface DiagnosticReportSearchParams {
  patient?: string
  encounter?: string
  status?: string
  category?: string
  code?: string
  _sort?: string
  _count?: number
}

export class DiagnosticReportClient {
  constructor(
    private baseUrl: string,
    private getHeaders: () => HeadersInit
  ) {}

  async getById(id: string): Promise<DiagnosticReport> {
    const response = await fetch(`${this.baseUrl}/DiagnosticReport/${id}`, {
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch diagnostic report ${id}: ${response.status}`)
    }
    return response.json()
  }

  async search(params: DiagnosticReportSearchParams = {}): Promise<DiagnosticReport[]> {
    const searchParams = new URLSearchParams()
    if (params.patient) searchParams.append('patient', params.patient)
    if (params.encounter) searchParams.append('encounter', params.encounter)
    if (params.status) searchParams.append('status', params.status)
    if (params.category) searchParams.append('category', params.category)
    if (params.code) searchParams.append('code', params.code)
    if (params._sort) searchParams.append('_sort', params._sort)
    if (params._count) searchParams.append('_count', params._count.toString())

    const query = searchParams.toString()
    const url = query ? `${this.baseUrl}/DiagnosticReport?${query}` : `${this.baseUrl}/DiagnosticReport`

    const response = await fetch(url, { headers: this.getHeaders() })
    if (!response.ok) {
      throw new Error(`Failed to search diagnostic reports: ${response.status}`)
    }

    const bundle: Bundle = await response.json()
    return (bundle.entry || [])
      .map(e => e.resource as DiagnosticReport)
      .filter(Boolean)
  }

  async getByPatient(patientId: string): Promise<DiagnosticReport[]> {
    return this.search({ patient: patientId, _sort: '-date', _count: 50 })
  }

  async getByEncounter(encounterId: string): Promise<DiagnosticReport[]> {
    return this.search({ encounter: encounterId, _sort: '-date' })
  }

  async getPending(patientId: string): Promise<DiagnosticReport[]> {
    return this.search({
      patient: patientId,
      status: 'registered,partial,preliminary',
      _sort: '-date',
    })
  }

  async getCompleted(patientId: string): Promise<DiagnosticReport[]> {
    return this.search({
      patient: patientId,
      status: 'final,amended',
      _sort: '-date',
      _count: 50,
    })
  }
}

/**
 * Get report name
 */
export function getReportName(report: DiagnosticReport): string {
  return report.code?.text || report.code?.coding?.[0]?.display || 'Unknown Report'
}

/**
 * Check if report is pending
 */
export function isPendingReport(report: DiagnosticReport): boolean {
  return ['registered', 'partial', 'preliminary'].includes(report.status || '')
}

/**
 * Check if report is critical for discharge
 */
export function isCriticalForDischarge(report: DiagnosticReport): boolean {
  const name = getReportName(report).toLowerCase()
  const criticalKeywords = ['culture', 'biopsy', 'ct', 'mri', 'echo', 'pathology', 'cytology']
  return criticalKeywords.some(k => name.includes(k))
}
