/**
 * useRiskScores Hook
 * 
 * Fetches risk scores (Fall, Readmission, Pressure Ulcer) for a patient
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import type { RiskScoresResult, PatientRiskFactors } from '@/lib/cds/risk-models'

export interface RiskScoresResponse extends RiskScoresResult {
    success: boolean
    factorsUsed: PatientRiskFactors
}

export function useRiskScores(patientId: string | undefined, options?: { enabled?: boolean }) {
    return useQuery<RiskScoresResponse>({
        queryKey: ['risk-scores', patientId],
        queryFn: async () => {
            const response = await fetch(`/api/cds/risk-scores?patientId=${patientId}`)
            if (!response.ok) {
                throw new Error('Failed to fetch risk scores')
            }
            return response.json()
        },
        enabled: !!patientId && (options?.enabled !== false),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        refetchOnWindowFocus: false,
    })
}

// Re-export types for convenience
export type { RiskScoresResult, PatientRiskFactors, RiskScore } from '@/lib/cds/risk-models'
