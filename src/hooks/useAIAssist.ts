/**
 * useAIAssist Hook
 * Handles AI diagnostic and billing assist requests
 */

'use client'

import { useMutation } from '@tanstack/react-query'

export interface DiagnosticSuggestion {
  condition: string
  icd10Code: string
  confidence: 'high' | 'moderate' | 'low'
  rationale: string
  supportingEvidence: Array<{
    type: string
    description: string
  }>
  differentialConsiderations?: string[]
  suggestedWorkup?: string[]
}

export interface DiagnosticAssistResponse {
  suggestions: DiagnosticSuggestion[]
  clinicalContext: string
  limitations: string[]
  disclaimer: string
}

export interface BillingCodeSuggestion {
  codeType: string
  code: string
  description: string
  category?: string
  evidence: Array<{
    source: string
    quote?: string
  }>
  documentationTip?: string
  complianceNotes?: string
}

export interface BillingAssistResponse {
  suggestedCodes: BillingCodeSuggestion[]
  missingDocumentation: Array<{
    codeAtRisk: string
    whatIsMissing: string
    suggestedAddition: string
  }>
  cmiImpact?: {
    currentEstimate: string
    potentialWithSuggestions: string
    explanation: string
  }
  complianceWarnings: string[]
  disclaimer: string
}

async function requestDiagnosticAssist(params: {
  encounterId: string
  selectedText: string
  noteContext?: string
}): Promise<DiagnosticAssistResponse> {
  const response = await fetch('/api/ai/diagnostic-assist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!response.ok) {
    throw new Error(`Diagnostic assist failed: ${response.status}`)
  }
  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || 'Diagnostic assist failed')
  }
  return result.data
}

async function requestBillingAssist(encounterId: string): Promise<BillingAssistResponse> {
  const response = await fetch(`/api/ai/billing-assist/${encounterId}`)
  if (!response.ok) {
    throw new Error(`Billing assist failed: ${response.status}`)
  }
  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || 'Billing assist failed')
  }
  return result.data
}

export function useDiagnosticAssist() {
  return useMutation({
    mutationFn: requestDiagnosticAssist,
  })
}

export function useBillingAssist() {
  return useMutation({
    mutationFn: requestBillingAssist,
  })
}

/**
 * Get confidence badge color
 */
export function getConfidenceBadgeColor(confidence: string): string {
  switch (confidence) {
    case 'high':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'moderate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'low':
      return 'bg-orange-100 text-orange-800 border-orange-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}
