/**
 * useCMISuggestions Hook
 * 
 * Fetches AI-powered CMI diagnosis suggestions for a patient
 */

'use client'

import { useQuery } from '@tanstack/react-query'

export interface CMIDiagnosis {
    code: string
    description: string
    category: 'mcc' | 'cc' | 'hcc' | 'secondary'
    confidence: 'high' | 'moderate' | 'low'
    evidence: string[]
    suggestedFromCondition?: string
}

export interface CMISuggestionsResponse {
    success: boolean
    suggestions: CMIDiagnosis[]
    documentationTips: string[]
    isAIGenerated: boolean
    error?: string
}

export function useCMISuggestions(patientId: string | undefined) {
    return useQuery<CMISuggestionsResponse>({
        queryKey: ['cmi-suggestions', patientId],
        queryFn: async () => {
            const response = await fetch(`/api/ai/cmi-suggestions?patientId=${patientId}`)
            if (!response.ok) {
                throw new Error('Failed to fetch CMI suggestions')
            }
            return response.json()
        },
        enabled: !!patientId,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        refetchOnWindowFocus: false,
    })
}
