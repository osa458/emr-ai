/**
 * useSepsisRisk Hook
 * 
 * Fetches sepsis risk scores for a patient from the CDS API
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import type { SepsisRiskResult, VitalsInput, LabsInput } from '@/lib/cds/sepsis-scoring'

export interface SepsisRiskResponse extends SepsisRiskResult {
    success: boolean
    vitalsUsed: VitalsInput
    labsUsed: LabsInput
}

export function useSepsisRisk(patientId: string | undefined, options?: { enabled?: boolean }) {
    return useQuery<SepsisRiskResponse>({
        queryKey: ['sepsis-risk', patientId],
        queryFn: async () => {
            const response = await fetch(`/api/cds/sepsis-risk?patientId=${patientId}`)
            if (!response.ok) {
                throw new Error('Failed to fetch sepsis risk')
            }
            return response.json()
        },
        enabled: !!patientId && (options?.enabled !== false),
        staleTime: 60 * 1000, // Cache for 1 minute - vitals change frequently
        refetchOnWindowFocus: true,
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes for inpatients
    })
}

// Re-export types for convenience
export type { SepsisRiskResult, VitalsInput, LabsInput }
