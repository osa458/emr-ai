/**
 * useDrugInteractions Hook
 * 
 * Fetches drug interaction alerts for a patient from the CDS API
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import type {
    DrugInteraction,
    DrugAllergyAlert,
    InteractionCheckResult
} from '@/lib/drug-interactions'

export interface DrugInteractionResult extends InteractionCheckResult {
    success: boolean
    patientId: string
    medicationCount: number
    allergyCount: number
}

export function useDrugInteractions(patientId: string | undefined) {
    return useQuery<DrugInteractionResult>({
        queryKey: ['drug-interactions', patientId],
        queryFn: async () => {
            const response = await fetch(`/api/cds/drug-interactions?patientId=${patientId}`)
            if (!response.ok) {
                throw new Error('Failed to fetch drug interactions')
            }
            return response.json()
        },
        enabled: !!patientId,
        staleTime: 2 * 60 * 1000, // Cache for 2 minutes
        refetchOnWindowFocus: false,
    })
}

// Re-export types for convenience
export type { DrugInteraction, DrugAllergyAlert, InteractionCheckResult }
