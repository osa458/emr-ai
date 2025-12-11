/**
 * useDischargeReadiness Hook
 * Fetches AI-generated discharge readiness assessment
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface DischargeReadinessData {
  readinessLevel: 'READY_TODAY' | 'READY_SOON' | 'NOT_READY'
  readinessScore: number
  readinessReasons: string[]
  blockingFactors: Array<{
    factor: string
    category: string
    details: string
    estimatedResolutionTime?: string
    responsibleParty?: string
  }>
  clinicalStatus: {
    vitalsStable: boolean
    vitalsNotes: string
    labsAcceptable: boolean
    labsNotes: string
    symptomsControlled: boolean
    symptomsNotes: string
    oxygenRequirement: string
    mobilityStatus: string
  }
  followupNeeds: Array<{
    specialty: string
    timeframe: string
    reason: string
    mode: string
    priority: string
  }>
  pendingTests: Array<{
    testName: string
    orderedDate?: string
    expectedResultDate?: string
    criticalForDischarge: boolean
  }>
  safetyChecks: Array<{
    item: string
    category: string
    completed: boolean
    notes?: string
  }>
  estimatedDischargeDate?: string
  dischargeDisposition?: string
  disclaimer: string
}

async function fetchDischargeReadiness(encounterId: string): Promise<DischargeReadinessData> {
  const response = await fetch(`/api/ai/discharge-readiness/${encounterId}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch discharge readiness: ${response.status}`)
  }
  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || 'Failed to assess discharge readiness')
  }
  return result.data
}

export function useDischargeReadiness(encounterId: string | undefined) {
  return useQuery({
    queryKey: ['discharge-readiness', encounterId],
    queryFn: () => fetchDischargeReadiness(encounterId!),
    enabled: !!encounterId,
    staleTime: 10 * 60 * 1000, // 10 minutes - AI assessment doesn't change frequently
    retry: 1,
  })
}

export function useRefreshDischargeReadiness() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (encounterId: string) => {
      return fetchDischargeReadiness(encounterId)
    },
    onSuccess: (data, encounterId) => {
      queryClient.setQueryData(['discharge-readiness', encounterId], data)
    },
  })
}

/**
 * Get badge color based on readiness level
 */
export function getReadinessBadgeColor(level: string): string {
  switch (level) {
    case 'READY_TODAY':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'READY_SOON':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'NOT_READY':
      return 'bg-red-100 text-red-800 border-red-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

/**
 * Get human-readable readiness label
 */
export function getReadinessLabel(level: string): string {
  switch (level) {
    case 'READY_TODAY':
      return 'Ready for Discharge'
    case 'READY_SOON':
      return 'Ready Soon (1-2 days)'
    case 'NOT_READY':
      return 'Not Ready'
    default:
      return 'Unknown'
  }
}
