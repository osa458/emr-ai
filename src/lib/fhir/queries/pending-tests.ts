/**
 * Pending Tests Query
 * Fetches pending diagnostic tests for a patient
 */

import type { DiagnosticReport, Task, Bundle } from '@medplum/fhirtypes'

export interface PendingTest {
  id: string
  name: string
  category: string
  status: string
  orderedDate?: string
  expectedDate?: string
  priority?: string
  orderingProvider?: string
  criticalForDischarge: boolean
}

export interface OpenConsult {
  id: string
  specialty: string
  reason?: string
  requestedDate?: string
  status: string
  requestingProvider?: string
  consultingProvider?: string
}

export interface PendingWorkup {
  pendingTests: PendingTest[]
  openConsults: OpenConsult[]
  totalPending: number
  criticalCount: number
}

/**
 * Get all pending tests and consults for a patient
 */
export async function getPendingWorkup(
  fhirBaseUrl: string,
  patientId: string,
  accessToken?: string
): Promise<PendingWorkup> {
  const headers: HeadersInit = {
    'Content-Type': 'application/fhir+json',
  }
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const [pendingTests, openConsults] = await Promise.all([
    fetchPendingTests(fhirBaseUrl, patientId, headers),
    fetchOpenConsults(fhirBaseUrl, patientId, headers),
  ])

  const criticalCount = pendingTests.filter(t => t.criticalForDischarge).length

  return {
    pendingTests,
    openConsults,
    totalPending: pendingTests.length + openConsults.length,
    criticalCount,
  }
}

async function fetchPendingTests(
  baseUrl: string,
  patientId: string,
  headers: HeadersInit
): Promise<PendingTest[]> {
  const bundle = await fetch(
    `${baseUrl}/DiagnosticReport?patient=${patientId}&status=registered,partial,preliminary&_sort=-date`,
    { headers }
  ).then(r => r.json()) as Bundle

  return (bundle.entry || [])
    .map(e => e.resource as DiagnosticReport)
    .filter(Boolean)
    .map(report => ({
      id: report.id!,
      name: report.code?.text || report.code?.coding?.[0]?.display || 'Unknown Test',
      category: report.category?.[0]?.coding?.[0]?.display || 'Laboratory',
      status: report.status || 'pending',
      orderedDate: report.issued,
      expectedDate: undefined, // Would need extension
      priority: undefined,
      orderingProvider: report.performer?.[0]?.display,
      criticalForDischarge: isCriticalTest(report),
    }))
}

async function fetchOpenConsults(
  baseUrl: string,
  patientId: string,
  headers: HeadersInit
): Promise<OpenConsult[]> {
  const bundle = await fetch(
    `${baseUrl}/Task?patient=${patientId}&status=requested,in-progress&_sort=-authored`,
    { headers }
  ).then(r => r.json()) as Bundle

  return (bundle.entry || [])
    .map(e => e.resource as Task)
    .filter(Boolean)
    .map(task => ({
      id: task.id!,
      specialty: task.code?.text || task.code?.coding?.[0]?.display || 'Unknown Specialty',
      reason: task.description,
      requestedDate: task.authoredOn,
      status: task.status || 'requested',
      requestingProvider: task.requester?.display,
      consultingProvider: task.owner?.display,
    }))
}

/**
 * Determine if a test is critical for discharge
 */
function isCriticalTest(report: DiagnosticReport): boolean {
  const criticalCodes = [
    '600-7',   // Blood culture
    '24323-8', // CT scan
    '24331-1', // MRI
    '11525-3', // ECG
    '30525-0', // Echocardiogram
    '24627-2', // Chest X-ray
    '38269-7', // Pathology
  ]

  const testCode = report.code?.coding?.[0]?.code
  if (testCode && criticalCodes.includes(testCode)) {
    return true
  }

  // Check for keywords in display text
  const displayText = (report.code?.text || report.code?.coding?.[0]?.display || '').toLowerCase()
  const criticalKeywords = ['culture', 'biopsy', 'ct', 'mri', 'echo', 'pathology', 'cytology']
  
  return criticalKeywords.some(keyword => displayText.includes(keyword))
}

/**
 * Get tests that are blocking discharge
 */
export async function getDischargeBlockingTests(
  fhirBaseUrl: string,
  patientId: string,
  accessToken?: string
): Promise<PendingTest[]> {
  const workup = await getPendingWorkup(fhirBaseUrl, patientId, accessToken)
  return workup.pendingTests.filter(t => t.criticalForDischarge)
}

/**
 * Format pending tests for AI prompt
 */
export function formatPendingTestsForPrompt(tests: PendingTest[]): string {
  if (tests.length === 0) {
    return 'No pending tests.'
  }

  return tests
    .map(t => {
      const critical = t.criticalForDischarge ? ' [CRITICAL FOR DISCHARGE]' : ''
      const ordered = t.orderedDate ? ` (ordered: ${new Date(t.orderedDate).toLocaleDateString()})` : ''
      return `- ${t.name}${critical}${ordered}`
    })
    .join('\n')
}

/**
 * Format open consults for AI prompt
 */
export function formatConsultsForPrompt(consults: OpenConsult[]): string {
  if (consults.length === 0) {
    return 'No open consults.'
  }

  return consults
    .map(c => {
      const status = c.status === 'in-progress' ? ' (in progress)' : ' (pending)'
      const date = c.requestedDate ? ` - requested ${new Date(c.requestedDate).toLocaleDateString()}` : ''
      return `- ${c.specialty}${status}${date}`
    })
    .join('\n')
}
