/**
 * useMorningTriage Hook
 * Fetches AI-generated morning triage prioritization
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface TriagePatient {
  patientId: string
  patientName: string
  location: string
  riskLevel: 'critical' | 'high' | 'moderate' | 'low'
  riskScore: number
  priorityRank: number
  riskFactors: Array<{
    factor: string
    severity: string
    details: string
    trend?: string
  }>
  deteriorationRisk?: {
    level: string
    indicators: string[]
    timeframe?: string
  }
  quickWins: Array<{
    action: string
    rationale: string
    priority: string
    timeToComplete: string
  }>
  keyUpdates: string[]
}

export interface MorningTriageData {
  generatedAt: string
  totalPatients: number
  criticalCount: number
  highRiskCount: number
  patients: TriagePatient[]
  systemAlerts: Array<{
    type: string
    message: string
    patientId: string
  }>
  disclaimer: string
}

async function fetchMorningTriage(params?: { service?: string; location?: string }): Promise<MorningTriageData> {
  const searchParams = new URLSearchParams()
  if (params?.service) searchParams.append('service', params.service)
  if (params?.location) searchParams.append('location', params.location)
  
  const query = searchParams.toString()
  const url = query ? `/api/ai/morning-triage?${query}` : '/api/ai/morning-triage'
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch morning triage: ${response.status}`)
  }
  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || 'Failed to generate triage')
  }
  return result.data
}

export function useMorningTriage(params?: { service?: string; location?: string }) {
  return useQuery({
    queryKey: ['morning-triage', params],
    queryFn: () => fetchMorningTriage(params),
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
  })
}

export function useRefreshMorningTriage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params?: { service?: string; location?: string }) => {
      return fetchMorningTriage(params)
    },
    onSuccess: (data, params) => {
      queryClient.setQueryData(['morning-triage', params], data)
    },
  })
}

/**
 * Get risk level badge color
 */
export function getRiskBadgeColor(level: string): string {
  switch (level) {
    case 'critical':
      return 'bg-red-600 text-white'
    case 'high':
      return 'bg-orange-500 text-white'
    case 'moderate':
      return 'bg-yellow-500 text-white'
    case 'low':
      return 'bg-green-500 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

/**
 * Get risk level icon
 */
export function getRiskIcon(level: string): string {
  switch (level) {
    case 'critical':
      return '🔴'
    case 'high':
      return '🟠'
    case 'moderate':
      return '🟡'
    case 'low':
      return '🟢'
    default:
      return '⚪'
  }
}
